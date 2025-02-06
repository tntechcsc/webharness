import React, { useState, useEffect } from "react";
import  ProtectedRoute  from "./ProtectedRoute"
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Home from './pages/home';
import Login from './pages/login';
import './App.css';

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100 bg-dark text-light">
        <div className="flex-grow-1">
          <Routes>
            <Route path="/" element={<ProtectedRoute element={<Home />} />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
