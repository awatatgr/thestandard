import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PasswordGate } from "./components/auth/PasswordGate";
import VideoListPage from "./pages/VideoListPage";
import VideoDetailPage from "./pages/VideoDetailPage";

function App() {
  return (
    <PasswordGate>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<VideoListPage />} />
          <Route path="/videos/:id" element={<VideoDetailPage />} />
        </Routes>
      </BrowserRouter>
    </PasswordGate>
  );
}

export default App;
