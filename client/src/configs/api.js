import axios from "axios";

const resolvedBaseUrl = import.meta.env.VITE_BASEURL
  ? import.meta.env.VITE_BASEURL
  : import.meta.env.PROD
  ? "/api"
  : "http://localhost:5000";

const api = axios.create({
  baseURL: resolvedBaseUrl,
  timeout: 15000,
});

export default api;