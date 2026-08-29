import { useEffect, useState, useRef } from 'react';
import MobileNav from './components/layout/MobileNav';
import PlayerBar from './components/player/PlayerBar';
import LyricsPanel from './components/lyrics/LyricsPanel';
import SplashScreen from './components/layout/SplashScreen';
import Home from './pages/Home';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Terms from './pages/Terms';
import Artist from './pages/Artist';
import Album from './pages/Album';
import usePlayerStore from './store/usePlayerStore';

function PageTransition({ viewKey, children }) {
  const [displayed, setDisplayed] = useState(children);
  const [animClass, setAnimClass] = useState('page-enter-active');
  const prevKey = useRef(viewKey);
  const pendingChildren = useRef(children);

  useEffect(() => {
    if (viewKey !== prevKey.current) {
      pendingChildren.current = children;
      setAnimClass('page-exit-active');
      const exitTimer = setTimeout(() => {
        setDisplayed(pendingChildren.current);
        setAnimClass('page-enter-active');
        prevKey.current = viewKey;
      }, 180);
      return () => clearTimeout(exitTimer);
    }
  }, [viewKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`page-transition ${animClass}`}>
      {displayed}
    </div>
  );
}

export default function App() {
  const { activeView, initAudio, currentTrack } = usePlayerStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initAudio();
  }, [initAudio]);

  const getViewKey = () => {
    if (typeof activeView === 'object' && activeView.id) {
      return `${activeView.id}-${activeView.data?.id || ''}`;
    }
    return activeView || 'home';
  };

  const renderView = () => {
    if (typeof activeView === 'object' && activeView.id) {
      switch (activeView.id) {
        case 'artist':
          return <Artist artistData={activeView.data} />;
        case 'album':
          return <Album albumData={activeView.data} />;
        default:
          return <Home />;
      }
    }

    switch (activeView) {
      case 'search':
        return <Search />;
      case 'settings':
        return <Settings />;
      case 'terms':
        return <Terms />;
      case 'home':
      default:
        return <Home />;
    }
  };

  return (
    <>
      {/* Splash Screen */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      <div className="flex flex-col h-screen w-screen bg-bg-primary overflow-hidden">
        {/* Main Content with Transition */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <PageTransition viewKey={getViewKey()}>
            {renderView()}
          </PageTransition>
        </main>

        {/* Lyrics Panel - overlay when track playing */}
        {currentTrack && <LyricsPanel />}

        {/* Player Bar - above bottom nav */}
        <PlayerBar />

        {/* Bottom Navigation */}
        <MobileNav />
      </div>
    </>
  );
}
