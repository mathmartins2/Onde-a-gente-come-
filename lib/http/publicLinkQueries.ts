import { apiClient } from './apiClient'

const requestPublicLinkPath = (endpoint: string) =>
  apiClient.post<{ path: string }>(endpoint).then((response) => response.data.path)

export const createRestaurantPublicLink = (restaurantId: string) =>
  requestPublicLinkPath(`/restaurants/${restaurantId}/public-link`)

export const createVisitRestaurantPublicLink = (visitId: string) =>
  requestPublicLinkPath(`/visits/${visitId}/public-link`)
