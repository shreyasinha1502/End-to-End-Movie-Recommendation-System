// =====================================================
// HOME PAGE JS
// =====================================================
$(function () {

  const input = $('#autoComplete');
  const button = $('.movie-button');

  // Enable / disable button
  input.on('input', function () {
    button.prop('disabled', input.val().trim() === "");
  });

  // 🔥 ENTER KEY SUPPORT
  input.on('keypress', function (e) {
    if (e.which === 13) {
      e.preventDefault();
      button.click();
    }
  });

  // Button click
  button.on('click', function () {
    const api_key = '5ce2ef2d7c461dea5b4e04900d1c561e';
    const title = input.val().trim();

    if (title === "") {
      $('.fail').show();
      return;
    }

    $('.fail').hide();
    load_details(api_key, title);
  });
});

// =====================================================
// CLICK ON RECOMMENDED MOVIE CARD
// =====================================================
function recommendcard(e) {
  const api_key = '5ce2ef2d7c461dea5b4e04900d1c561e';
  const title = e.getAttribute('title');
  load_details(api_key, title);
}

// =====================================================
// SEARCH MOVIE FROM TMDB
// =====================================================
function load_details(api_key, title) {
  $.ajax({
    type: 'GET',
    url: `https://api.themoviedb.org/3/search/movie?api_key=${api_key}&query=${title}`,

    success: function (movie) {
      if (!movie.results || movie.results.length === 0) {
        $('.fail').show();
        return;
      }

      const movie_id = movie.results[0].id;
      const movie_title = movie.results[0].original_title;

      movie_recs(movie_title, movie_id, api_key);
    },

    error: function () {
      alert("TMDB API Error");
    }
  });
}

// =====================================================
// GET SIMILAR MOVIES FROM FLASK
// =====================================================
function movie_recs(movie_title, movie_id, api_key) {
  $.ajax({
    type: 'POST',
    url: '/similarity',
    data: { name: movie_title },

    success: function (recs) {
      if (recs.includes("Sorry")) {
        $('.fail').show();
        return;
      }

      const movies = recs.split('---');
      get_movie_details(movie_id, api_key, movies, movie_title);
    },

    error: function () {
      alert("Similarity Error");
    }
  });
}

// =====================================================
// FETCH MOVIE DETAILS + REDIRECT TO /recommend
// =====================================================
function get_movie_details(movie_id, api_key, arr, movie_title) {

  $.ajax({
    type: 'GET',
    url: `https://api.themoviedb.org/3/movie/${movie_id}?api_key=${api_key}`,

    success: function (movie) {

      // 🔥 CREATE FORM FOR REDIRECT
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/recommend";

      const data = {
        title: movie_title,
        poster: "https://image.tmdb.org/t/p/original" + movie.poster_path,
        overview: movie.overview,
        genres: movie.genres.map(g => g.name).join(", "),
        rating: movie.vote_average,
        vote_count: movie.vote_count,
        release_date: movie.release_date,
        runtime: Math.floor(movie.runtime / 60) + "h " + (movie.runtime % 60) + "m",
        status: movie.status,
        rec_movies: JSON.stringify(arr),
        rec_posters: JSON.stringify(get_movie_posters(arr, api_key))
      };

      // Append inputs
      for (let key in data) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = data[key];
        form.appendChild(input);
      }

      document.body.appendChild(form);

      // 🔥 FORCE SUBMIT
      form.submit();
    },

    error: function () {
      alert("Movie Detail Error");
    }
  });
}

// =====================================================
// GET POSTERS FOR RECOMMENDED MOVIES
// =====================================================
function get_movie_posters(arr, api_key) {
  let posters = [];

  for (let i = 0; i < arr.length; i++) {
    $.ajax({
      type: 'GET',
      url: `https://api.themoviedb.org/3/search/movie?api_key=${api_key}&query=${arr[i]}`,
      async: false,

      success: function (m) {
        posters.push(
          "https://image.tmdb.org/t/p/original" + m.results[0].poster_path
        );
      }
    });
  }
  return posters;
}
