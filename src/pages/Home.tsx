import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination } from 'swiper/modules';
import { Home as HomeIcon, Heart, Star, Search } from 'lucide-react';
import { Movie } from '../types';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

const CATEGORIES = ['Trending', 'New', 'Movies', 'Series', 'TV shows'];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [activeMovieIndex, setActiveMovieIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/media/category/${encodeURIComponent(activeCategory)}`);
        const data = await res.json();
        setMovies(data.results || []);
        setActiveMovieIndex(0);
      } catch (err) {
        console.error(`Failed to fetch ${activeCategory}`, err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategory();
  }, [activeCategory]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/media/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const activeMovie = movies[activeMovieIndex];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 pb-24 font-sans selection:bg-emerald-500/30">
      {/* Search Bar */}
      <div className="px-6 pt-12 pb-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search movies & TV shows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-full py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-500"
          />
        </div>
      </div>

      {searchQuery.trim() ? (
        <div className="px-6 mt-6">
          <h3 className="text-xl font-semibold mb-6">Search Results</h3>
          {isSearching ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {searchResults.map(movie => (
                <Link key={movie.id} to={`/${movie.media_type || 'movie'}/${movie.id}`} className="block mb-4">
                  <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 mb-2 border border-white/5">
                    {movie.poster_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`} 
                        alt={movie.title || movie.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs">No Image</div>
                    )}
                  </div>
                  <p className="text-sm font-medium line-clamp-1">{movie.title || movie.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                    <span className="text-xs text-zinc-400">{movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-zinc-500 py-10">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Top Navigation */}
          <div className="pt-4 pb-6 px-6 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-6 min-w-max">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-lg font-medium transition-colors ${
                    activeCategory === cat ? 'text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Hero Carousel */}
          {loading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="relative w-full overflow-hidden">
              <Swiper
                effect={'coverflow'}
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={1.5}
                spaceBetween={0}
                coverflowEffect={{
                  rotate: 0,
                  stretch: 0,
                  depth: 200,
                  modifier: 1,
                  slideShadows: true,
                }}
                pagination={{
                  el: '.custom-pagination',
                  clickable: true,
                  bulletClass: 'swiper-pagination-bullet !bg-zinc-600 !opacity-50 !w-1.5 !h-1.5 !mx-1 transition-all',
                  bulletActiveClass: '!bg-emerald-500 !opacity-100 !w-4 !rounded-full',
                }}
                modules={[EffectCoverflow, Pagination]}
                onSlideChange={(swiper) => setActiveMovieIndex(swiper.activeIndex)}
                className="w-full pt-4 pb-8"
              >
                {movies.map((movie) => (
                  <SwiperSlide key={movie.id} className="w-[280px] sm:w-[320px]">
                    <Link to={`/${movie.media_type || 'movie'}/${movie.id}`} className="block relative aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl border border-white/5">
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                          alt={movie.title || movie.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                          <span className="text-zinc-500">No Image</span>
                        </div>
                      )}
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Active Movie Info */}
              {activeMovie && (
                <div className="px-6 flex flex-col items-center text-center mt-2">
                  <span className="text-sm text-zinc-400 font-medium tracking-wide">
                    {(activeMovie.release_date || activeMovie.first_air_date) ? (activeMovie.release_date || activeMovie.first_air_date)!.split('-')[0] : 'N/A'}
                  </span>
                  <h2 className="text-3xl font-bold mt-1 mb-4 tracking-tight">{activeMovie.title || activeMovie.name}</h2>
                  
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-zinc-300">
                    <span className="px-3 py-1.5 bg-zinc-800/80 rounded-full border border-white/5">
                      Action
                    </span>
                    <span className="px-3 py-1.5 bg-zinc-800/80 rounded-full border border-white/5">
                      2h 15m
                    </span>
                    <span className="px-3 py-1.5 bg-zinc-800/80 rounded-full border border-white/5 flex items-center gap-1">
                      <Star className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                      {activeMovie.vote_average ? activeMovie.vote_average.toFixed(1) : 'N/A'}
                    </span>
                  </div>

                  {/* Custom Pagination Container */}
                  <div className="custom-pagination mt-6 flex justify-center items-center h-4" />
                </div>
              )}
            </div>
          )}

          {/* For You Section */}
          {!loading && (
            <div className="mt-8 px-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">For you</h3>
                <button className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors">See all</button>
              </div>
              
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                {movies.slice(5).map((movie) => (
                  <Link key={movie.id} to={`/${movie.media_type || 'movie'}/${movie.id}`} className="shrink-0 w-[140px]">
                    <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 mb-2">
                      {movie.poster_path && (
                        <img
                          src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                          alt={movie.title || movie.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[200px] h-16 bg-zinc-900/90 backdrop-blur-xl rounded-full flex items-center justify-around px-6 border border-white/5 shadow-2xl z-50">
        <button className="p-3 text-emerald-500 bg-emerald-500/10 rounded-full transition-colors">
          <HomeIcon className="w-6 h-6" />
        </button>
        <button className="p-3 text-zinc-500 hover:text-emerald-400 transition-colors">
          <Heart className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
