import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import BoardView from './pages/BoardView';
import TempleDetail from './pages/TempleDetail';
import VisitForm from './pages/VisitForm';
import Timeline from './pages/Timeline';
import Album from './pages/Album';
import NearbyView from './pages/NearbyView';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<BoardView />} />
        <Route path="/temple/:id" element={<TempleDetail />} />
        <Route path="/visit/new" element={<VisitForm />} />
        <Route path="/visit/:id" element={<VisitForm />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/album" element={<Album />} />
        <Route path="/nearby" element={<NearbyView />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
