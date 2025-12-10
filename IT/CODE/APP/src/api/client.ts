import axios from 'axios'

export const api = axios.create({
  baseURL: 'https://backend.example.com/api',
  timeout: 10000,
})
