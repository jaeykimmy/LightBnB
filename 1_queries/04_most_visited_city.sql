SELECT properties.city, count(reservations)
FROM reservations
JOIN properties ON properties.id = property_id
GROUP BY properties.city
ORDER BY count(reservations) DESC