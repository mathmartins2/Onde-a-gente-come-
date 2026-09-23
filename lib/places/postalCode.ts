export const postalCodeDigitCount = 8

export const extractPostalCodeDigits = (value: string) => value.replace(/\D/g, '').slice(0, postalCodeDigitCount)

export const formatPostalCode = (value: string) => {
  const digits = extractPostalCodeDigits(value)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export const isCompletePostalCode = (value: string) => extractPostalCodeDigits(value).length === postalCodeDigitCount

const streetNumberPattern = /\b\d+[A-Za-z]?\b/

export const buildAddressFromStreet = (street: string, currentAddress: string) => {
  const streetNumber = currentAddress.match(streetNumberPattern)?.[0]
  return streetNumber ? `${street}, ${streetNumber}` : `${street}, `
}
