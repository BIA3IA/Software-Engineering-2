import axios from 'axios'

export const api = axios.create({
  baseURL: 'https://backend.example.com/api', // TODO: change
  timeout: 10000,
})
