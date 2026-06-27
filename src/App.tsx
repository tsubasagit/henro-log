import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import TempleList from './pages/TempleList';
import TempleDetail from './pages/TempleDetail';
import VisitForm from './pages/VisitForm';
import Timeline from './pages/Timeline';
import Companions from './pages/Companions';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<TempleList />} />
        <Route path="/temple/:id" element={<TempleDetail />} />
        <Route path="/visit/new" element={<VisitForm />} />
        <Route path="/visit/:id" element={<VisitForm />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/companions" element={<Companions />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
