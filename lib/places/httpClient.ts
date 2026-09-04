import axios from 'axios'

export const placesHttpClient = axios.create({
  timeout: 8000,
  headers: {
    'User-Agent': 'RestaurantDrawApp/1.0 (grupo de amigos; contato via app)',
    Accept: 'application/json',
  },
  validateStatus: (status) => status >= 200 && status < 300,
})

export const redirectFollowingClient = axios.create({
  timeout: 8000,
  maxRedirects: 0,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RestaurantDrawApp/1.0)' },
  validateStatus: (status) => status >= 200 && status < 400,
})
