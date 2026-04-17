export interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  overview: string;
  genre_ids?: number[];
  media_type?: string;
}

export interface Season {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  season_number: number;
}

export interface Episode {
  air_date: string;
  episode_number: number;
  id: number;
  name: string;
  overview: string;
  still_path: string;
  vote_average: number;
  runtime: number;
}

export interface MovieDetails extends Movie {
  runtime?: number;
  episode_run_time?: number[];
  genres: { id: number; name: string }[];
  seasons?: Season[];
  number_of_seasons?: number;
  credits: {
    cast: { id: number; name: string; profile_path: string | null; character: string }[];
  };
  videos: {
    results: { id: string; key: string; name: string; site: string; type: string }[];
  };
  platform?: string;
  intro_video_link?: string;
  videoUrl?: string;
}
