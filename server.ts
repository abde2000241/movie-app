import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Routes
  app.get("/api/media/category/:category", async (req, res) => {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY) return res.status(500).json({ error: "TMDB_API_KEY is missing." });
    try {
      const category = req.params.category.toLowerCase();
      let url = "";
      let defaultMediaType = "";

      switch (category) {
        case "trending":
          url = `https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}`;
          break;
        case "new":
          url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}`;
          defaultMediaType = "movie";
          break;
        case "movies":
          url = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}`;
          defaultMediaType = "movie";
          break;
        case "series":
        case "tv shows":
          url = `https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}`;
          defaultMediaType = "tv";
          break;
        default:
          url = `https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      // Ensure media_type is set for endpoints that don't return it
      if (defaultMediaType && data.results) {
        data.results = data.results.map((item: any) => ({
          ...item,
          media_type: item.media_type || defaultMediaType
        }));
      }

      // Filter out Heated Rivalry or any requested exclusions
      if (data.results) {
        data.results = data.results.filter((item: any) => {
          const title = (item.title || item.name || "").toLowerCase();
          return !title.includes("heated rivalry");
        });
      }

      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch media category" });
    }
  });

  app.get("/api/media/trending", async (req, res) => {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY) return res.status(500).json({ error: "TMDB_API_KEY is missing. Please add it in the Secrets panel." });
    try {
      const response = await fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      if (data.results) {
        data.results = data.results.filter((item: any) => {
          const title = (item.title || item.name || "").toLowerCase();
          return !title.includes("heated rivalry");
        });
      }
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch trending media" });
    }
  });

  app.get("/api/media/search", async (req, res) => {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY) return res.status(500).json({ error: "TMDB_API_KEY is missing. Please add it in the Secrets panel." });
    try {
      const query = req.query.q;
      const response = await fetch(`https://api.themoviedb.org/3/search/multi?query=${query}&api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      if (data.results) {
        data.results = data.results.filter((item: any) => {
          const title = (item.title || item.name || "").toLowerCase();
          return !title.includes("heated rivalry");
        });
      }
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Failed to search media" });
    }
  });

  app.get("/api/media/:type/:id", async (req, res) => {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY) return res.status(500).json({ error: "TMDB_API_KEY is missing." });
    try {
      const { type, id } = req.params;
      const validTypes = ["movie", "tv"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: "Invalid media type" });
      }
      const response = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`);
      const data = await response.json();

      // Determine platform and video link based on production companies
      const companies = data.production_companies?.map((c: any) => c.name.toLowerCase()) || [];
      let platform = "Other";
      let intro_video_link = "<source src='../../assets/video/movie.mp4' type='video/mp4' label='SD'> <source src='../../assets/video/movie.mp4' type='video/mp4' label='HD'>";

      if (companies.some((c: string) => c.includes("netflix"))) {
          platform = "Netflix";
          intro_video_link = "<source src='https://botoflix.com/netflix.mp4' type='video/mp4' label='HD'>";
      } else if (companies.some((c: string) => c.includes("amazon") || c.includes("prime"))) {
          platform = "Prime Video";
          intro_video_link = "<source src='https://olloflix.com/primevideo.mp4' type='video/mp4' label='HD'>";
      } else if (companies.some((c: string) => c.includes("warner bros"))) {
          platform = "Warner Bros";
          intro_video_link = "<source src='https://1cima.com/a-minecraft-movie.mp4' type='video/mp4' label='HD'>";
      }

      data.platform = platform;
      data.intro_video_link = intro_video_link;
      
      // Map requested fields
      const runtime = data.runtime || (data.episode_run_time && data.episode_run_time[0]) || 0;
      data.duration = runtime ? `${Math.floor(runtime / 60)}h ${runtime % 60}m` : "N/A";
      data.genre = data.genres?.map((g: any) => g.name).join(" / ") || "N/A";
      data.summary = data.overview;

      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch movie details" });
    }
  });

  app.get("/api/media/tv/:id/season/:season_number", async (req, res) => {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    if (!TMDB_API_KEY) return res.status(500).json({ error: "TMDB_API_KEY is missing." });
    try {
      const { id, season_number } = req.params;
      const response = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${season_number}?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch season details" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
