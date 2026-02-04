// axiosConfig.js
import axios from "axios";

const hostname = window.location.hostname;
const envUrl = import.meta.env.VITE_BE_API_URL;
// Nếu không có env hoặc đang truy cập qua IP (test LAN) mà env lại là localhost -> dùng IP động
const BASE_URL = (!envUrl || (hostname !== 'localhost' && envUrl.includes('localhost')))
  ? `http://${hostname}:8088/api`
  : envUrl;

export default axios.create({
  baseURL: BASE_URL,
});

export const axiosPrivate = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});
