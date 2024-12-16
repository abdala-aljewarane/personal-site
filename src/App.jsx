import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidenav from './components/Sidenav';
import Main from './components/Main';
import Blog from './components/Blog';
import Footer from './components/Footer';
import AdminRoute from './components/admin/AdminRoute';
import BlogPost from './components/admin/BlogPost';
import SignIn from './components/admin/SignIn';
import BlogView from './components/BlogView';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Sidenav />
        <Routes>
          <Route path="/" element={
            <>
              <Main />
              <Footer />
            </>
          } />
          <Route path="/blog" element={
            <>
              <Blog />
              <Footer />
            </>
          } />
          <Route path="/blog/:id" element={
            <>
              <BlogView />
              <Footer />
            </>
          } />
          <Route path="/admin" element={
            <>
              <SignIn />
              <Footer />
            </>
          } />
          <Route 
            path="/admin/post" 
            element={
              <AdminRoute>
                <BlogPost />
                <Footer />
              </AdminRoute>
            } 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;