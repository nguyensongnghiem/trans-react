// apiService.js

/**
 * Generic API helpers that work with any axios instance
 * Use these for common operations like file uploads
 */

export const fetchData = async (axiosInstance, endpoint) => {
  const res = await axiosInstance.get(endpoint);
  return res.data;
};

export const postData = async (axiosInstance, endpoint, data) => {
  const res = await axiosInstance.post(endpoint, data);
  return res.data;
};

export const postFile = async (axiosInstance, endpoint, formData) => {
  const res = await axiosInstance.post(endpoint, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const putData = async (axiosInstance, endpoint, data) => {
  const res = await axiosInstance.put(endpoint, data);
  return res.data;
};

export const deleteData = async (axiosInstance, endpoint) => {
  await axiosInstance.delete(endpoint);
  return true;
};
