import axios from "axios";
import { toast } from "react-toastify";

const BASE_URL = import.meta.env.VITE_BE_API_URL || "http://localhost:8088/api";

/* ======================
   AXIOS INSTANCE CHUẨN
====================== */
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

/* ======================
   GET
====================== */
export const fetchData = async (endpoint) => {
  try {
    const res = await api.get(endpoint);
    return res.data;
  } catch (error) {
    console.error("❌ GET ERROR:", error);
    throw error;
  }
};

/* ======================
   POST JSON
====================== */
export const postData = async (endpoint, data) => {
  try {
    const res = await api.post(endpoint, data);
    return res.data;
  } catch (error) {
    console.error("❌ POST ERROR:", error);
    throw error;
  }
};

/* ======================
   POST FILE / EXCEL
====================== */
export const postFile = async (endpoint, formData) => {
  try {
    const res = await api.post(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ POST FILE ERROR:", error);
    throw error;
  }
};

/* ======================
   PUT
====================== */
export const putData = async (endpoint, data) => {
  try {
    const res = await api.put(endpoint, data);
    return res.data;
  } catch (error) {
    console.error("❌ PUT ERROR:", error);
    throw error;
  }
};

/* ======================
   DELETE
====================== */
export const deleteData = async (endpoint) => {
  try {
    await api.delete(endpoint);
  } catch (error) {
    console.error("❌ DELETE ERROR:", error);
    throw error;
  }
};
const apiService = {
  fetchData,
  postData,
  putData,
  deleteData,
  postFile,
};

export default apiService;
