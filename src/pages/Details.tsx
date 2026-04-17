import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Play, Star } from 'lucide-react';
import { MovieDetails, Episode } from '../types';

export default function Details() {
  const { type, id } = useParams<{ type: string, id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setIsPlaying(false);
        setIframeLoaded(false);
        
        const res = await fetch(`/api/media/${type || 'movie'}/${id}`);
        const data = await res.json();
        setMovie(data);

        if (type === 'tv' && data.seasons && data.seasons.length > 0) {
          const validSeasons = data.seasons.filter((s: any) => s.season_number > 0);
          if (validSeasons.length > 0) {
            setSelectedSeason(validSeasons[0].season_number);
          }
        }
      } catch (err) {
        console.error("Failed to fetch movie details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [type, id]);

  useEffect(() => {
    if (type === 'tv' && selectedSeason !== null) {
      const fetchEpisodes = async () => {
        try {
          setEpisodesLoading(true);
          const res = await fetch(`/api/media/tv/${id}/season/${selectedSeason}`);
          const data = await res.json();
          setEpisodes(data.episodes || []);
        } catch (err) {
          console.error("Failed to fetch episodes", err);
        } finally {
          setEpisodesLoading(false);
        }
      };
      fetchEpisodes();
    }
  }, [type, id, selectedSeason]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center">
        <p>Media not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-emerald-500 hover:text-emerald-400 transition-colors">Go Back</button>
      </div>
    );
  }

  const releaseDate = movie.release_date || movie.first_air_date;
  const releaseYear = releaseDate ? releaseDate.split('-')[0] : 'N/A';
  const releaseDateFormatted = releaseDate ? new Date(releaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';
  
  // Format runtime (e.g., 135 -> 2h 15m)
  const runtime = movie.runtime || (movie.episode_run_time && movie.episode_run_time[0]) || 0;
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  const runtimeStr = runtime ? `${hours}h ${minutes}m` : 'N/A';

  const topCast = movie.credits?.cast?.slice(0, 4) || [];

  const iframeSrc = type === 'tv' 
    ? `https://vidlink.pro/tv/${id}/${selectedSeason || 1}/${selectedEpisode || 1}`
    : `https://vidlink.pro/movie/${id}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans pb-12 selection:bg-emerald-500/30">
      {/* Backdrop Section */}
      <div className="relative w-full h-[50vh] sm:h-[60vh]">
        {isPlaying ? (
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            {/* Loading Placeholder */}
            {!iframeLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10">
                <div className="w-10 h-10 border-4 border-zinc-700 border-t-emerald-500 rounded-full animate-spin mb-4" />
                <p className="text-zinc-400 font-medium tracking-wide animate-pulse">Loading Player...</p>
              </div>
            )}
            
            {/* Iframe */}
            <iframe
              src={iframeSrc}
              className={`w-full h-full border-0 transition-opacity duration-500 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
              allowFullScreen
              onLoad={() => setIframeLoaded(true)}
            />
            
            {/* Top Nav (Back button inside player) */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-20 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b from-black/80 to-transparent">
              <button 
                onClick={() => setIsPlaying(false)}
                className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/60 transition-colors text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {movie.backdrop_path ? (
              <img
                src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
                alt={movie.title || movie.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-zinc-900" />
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-zinc-950 pointer-events-none" />

            {/* Play Button */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <button 
                onClick={() => setIsPlaying(true)}
                className="w-16 h-16 bg-emerald-500/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-emerald-500/30 transition-colors border border-emerald-500/30 shadow-2xl group"
              >
                <Play className="w-6 h-6 text-emerald-500 ml-1 fill-emerald-500 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </>
        )}

        {/* Top Nav */}
        {!isPlaying && (
          <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10 pointer-events-none">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/40 transition-colors pointer-events-auto"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/40 transition-colors pointer-events-auto">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="px-6 -mt-12 relative z-20">
        <p className="text-sm text-zinc-400 font-medium mb-1">{releaseDateFormatted}</p>
        <h1 className="text-4xl font-bold tracking-tight mb-4">{movie.title || movie.name}</h1>

        {/* Meta Tags */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-300 mb-8">
          <span className="px-3 py-1.5 bg-zinc-800/80 rounded-full border border-white/5">
            {runtimeStr}
          </span>
          {movie.genres?.[0] && (
            <span className="px-3 py-1.5 bg-zinc-800/80 rounded-full border border-white/5">
              {movie.genres[0].name}
            </span>
          )}
          <span className="px-3 py-1.5 bg-zinc-800/80 rounded-full border border-white/5">
            {type === 'tv' ? 'TV Show' : 'Movie'}
          </span>
          <span className="px-3 py-1.5 bg-zinc-800/80 rounded-full border border-white/5">
            13+
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-3 mb-10">
          <Star className="w-8 h-8 text-emerald-500 fill-emerald-500" />
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
            <span className="text-sm text-zinc-500 font-medium">/10</span>
          </div>
          <div className="ml-4 flex gap-4 text-xs text-zinc-400 font-medium">
            <div className="flex flex-col">
              <span className="text-zinc-50">60K</span>
              <span>votes</span>
            </div>
            <div className="flex flex-col">
              <span className="text-zinc-50">158</span>
              <span>reviews</span>
            </div>
          </div>
        </div>

        {/* Cast */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Cast</h3>
            <button className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors">See all</button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {topCast.map((actor) => (
              <div key={actor.id} className="shrink-0 flex flex-col items-center gap-2 w-[80px]">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-800">
                  {actor.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
                      alt={actor.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No Img</div>
                  )}
                </div>
                <span className="text-xs text-center font-medium leading-tight line-clamp-2">{actor.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Synopsis */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Synopsis</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {movie.overview}
          </p>
        </div>

        {/* Episodes Section */}
        {type === 'tv' && movie.seasons && movie.seasons.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Episodes</h3>
              <select 
                className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                value={selectedSeason || ''}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
              >
                {movie.seasons.filter(s => s.season_number > 0).map(season => (
                  <option key={season.id} value={season.season_number}>
                    Season {season.season_number}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col gap-4">
              {episodesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
                </div>
              ) : episodes.length > 0 ? (
                episodes.map(episode => (
                  <div 
                    key={episode.id} 
                    onClick={() => {
                      setSelectedEpisode(episode.episode_number);
                      setIsPlaying(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex gap-4 p-3 rounded-xl cursor-pointer transition-colors ${selectedEpisode === episode.episode_number && isPlaying ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-zinc-900 hover:bg-zinc-800 border border-white/5'}`}
                  >
                    <div className="w-32 h-20 shrink-0 rounded-lg overflow-hidden bg-zinc-800 relative group">
                      {episode.still_path ? (
                        <img 
                          src={`https://image.tmdb.org/t/p/w300${episode.still_path}`} 
                          alt={episode.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No Img</div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-sm line-clamp-1">{episode.episode_number}. {episode.name}</h4>
                        <span className="text-xs text-zinc-500 shrink-0">{episode.runtime ? `${episode.runtime}m` : ''}</span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{episode.overview || 'No description available.'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-sm text-center py-4">No episodes found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
