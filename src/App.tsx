import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import TempleList from './pages/TempleList';
import MapView from './pages/MapView';
import TempleDetail from './pages/TempleDetail';
import VisitForm from './pages/VisitForm';
import Timeline from './pages/Timeline';
import Album from './pages/Album';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<TempleList />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/temple/:id" element={<TempleDetail />} />
        <Route path="/visit/new" element={<VisitForm />} />
        <Route path="/visit/:id" element={<VisitForm />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/album" element={<Album />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
