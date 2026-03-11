import os
import json
import pandas as pd
from flask import Flask, render_template, request
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "Artifacts")
DATA_PATH = os.path.join(ARTIFACTS_DIR, "main_data.csv")

app = Flask(__name__)

# ==========================
# LOAD DATA & MODEL
# ==========================
data = pd.read_csv(DATA_PATH)
data["movie_title"] = data["movie_title"].str.lower()

vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")
matrix = vectorizer.fit_transform(data["comb"])
similarity = cosine_similarity(matrix)

# ==========================
# UTILS
# ==========================
def get_suggestions():
    return list(data["movie_title"].str.title())

def convert_to_list(text):
    return json.loads(text)

def recommend_movie(movie):
    movie = movie.lower().strip()
    matches = data[data["movie_title"].str.contains(movie, na=False)]

    if matches.empty:
        return []

    idx = matches.index[0]
    scores = sorted(
        list(enumerate(similarity[idx])),
        key=lambda x: x[1],
        reverse=True
    )[1:11]

    return [data.iloc[i[0]].movie_title.title() for i in scores]

# ==========================
# ROUTES
# ==========================
@app.route("/")
def home():
    return render_template("home.html", suggestions=get_suggestions())

@app.route("/similarity", methods=["POST"])
def similarity_route():
    movie = request.form.get("name")
    recs = recommend_movie(movie)

    if not recs:
        return "Sorry"

    return "---".join(recs)

@app.route("/recommend", methods=["POST"])
def recommend():
    return render_template(
        "recommend.html",
        title=request.form.get("title"),
        poster=request.form.get("poster"),
        overview=request.form.get("overview"),
        genres=request.form.get("genres"),
        rating=request.form.get("rating"),
        vote_count=request.form.get("vote_count"),
        release_date=request.form.get("release_date"),
        runtime=request.form.get("runtime"),
        status=request.form.get("status"),
        movie_cards=dict(
            zip(
                convert_to_list(request.form.get("rec_posters")),
                convert_to_list(request.form.get("rec_movies"))
            )
        )
    )

# ==========================
# RUN APP (RENDER READY)
# ==========================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
