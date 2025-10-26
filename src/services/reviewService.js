// src/services/reviewService.js
import axios from "axios";

const API_URL = "http://localhost:3002/api/hotels"; // your backend base

// ✅ Add review
export const addReview = async (hotelId, reviewData, token) => {
  const res = await axios.post(`${API_URL}/${hotelId}/reviews`, reviewData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ✅ Get all reviews for a hotel
export const getHotelReviews = async (hotelId) => {
  const res = await axios.get(`${API_URL}/${hotelId}/reviews`);
  return res.data;
};

// ✅ Update review
export const updateReview = async (hotelId, reviewId, reviewData, token) => {
  const res = await axios.put(
    `${API_URL}/${hotelId}/reviews/${reviewId}`,
    reviewData,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

// ✅ Delete review
export const deleteReview = async (hotelId, reviewId, token) => {
  const res = await axios.delete(`${API_URL}/${hotelId}/reviews/${reviewId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};