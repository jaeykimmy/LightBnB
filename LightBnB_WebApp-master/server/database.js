const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');
/// Users
const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

pool.connect(() => {
  console.log("Connected to database!");
});

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
// const getUserWithEmail = function(email) {
//   let user;
//   for (const userId in users) {
//     user = users[userId];
//     if (user.email.toLowerCase() === email.toLowerCase()) {
//       break;
//     } else {
//       user = null;
//     }
//   }
//   return Promise.resolve(user);
// };
const getUserWithEmail = function(email) {
  return pool
    .query(`SELECT * FROM users WHERE email=$1`, [email])
    .then(result => {
      if (result.rows.length === 0) {
        return null;
      } else {
        console.log(result.rows[0]);
        return result.rows[0];
      }
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
// const getUserWithId = function(id) {
//   return Promise.resolve(users[id]);
// };
const getUserWithId = function(id) {
  return pool
    .query(`SELECT * FROM users WHERE id=$1`, [id])
    .then(result => {
      if (result.rows.length === 0) {
        return null;
      } else {
        console.log(result.rows[0]);
        return result.rows[0];
      }
    })
    .catch((err) => {
      console.log(err.message);
    });
};
// const getUserWithId = function(id) {
//   return pool
//     .query(`SELECT name FROM users`)
//     .then((result) => result.rows)
//     .catch((err) => {
//       console.log(err.message);
//     });
// };
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
// const addUser =  function(user) {
//   const userId = Object.keys(users).length + 1;
//   user.id = userId;
//   users[userId] = user;
//   return Promise.resolve(user);
// };
const addUser = function(user) {
  return pool
    .query(`INSERT INTO users(name, password, email)
    VALUES ($1, $2, $3)
    RETURNING *;`, [user.name, user.email, user.password])
    .then(res => {
      return res.rows[0];
    });
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
// const getAllReservations = function(guest_id, limit = 10) {
//   return getAllProperties(null, 2);
// };
const getAllReservations = function(guest_id, limit = 10) {
  return pool.query(
    `SELECT reservations.*, properties.*, avg(rating) as average_rating
    FROM reservations
    JOIN properties ON properties.id = reservations.property_id
    JOIN property_reviews ON reservations.id = property_reviews.reservation_id
    WHERE reservations.guest_id = $1
    AND reservations.end_date < now()::date
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2`, [guest_id, limit])
    .then(result => {
      return result.rows;
    });
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
// const getAllProperties = function (options, limit = 10) {
  
//   const limitedProperties = {};
//   for (let i = 1; i <= limit; i++) {
//     limitedProperties[i] = properties[i];
//   }
//   return Promise.resolve(limitedProperties);
// };
// const getAllProperties = (options, limit = 10) => {
//   return pool
//     .query(`SELECT * FROM properties LIMIT $1`, [limit])
//     .then((result) => result.rows)
//     .catch((err) => {
//       console.log(err.message);
//     });
// };

const getAllProperties = function(options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(`%${options.owner_id}%`);
    if (queryParams.length > 0) {
      queryString += `AND owner_id = $${queryParams.length} `;
    } else {
      queryString += `WHERE owner_id = $${queryParams.length} `;
    }
  }

  if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night}`);
    if (queryParams.length > 0) {
      queryString += `AND cost_per_night > $${queryParams.length} `;
    } else {
      queryString += `WHERE cost_per_night > $${queryParams.length} `;
    }
  }

  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night}`);
    if (queryParams.length > 0) {
      queryString += `AND cost_per_night <  $${queryParams.length} `;
    } else {
      queryString += `WHERE cost_per_night <  $${queryParams.length} `;
    }
  }

  // 4
  queryString += `GROUP BY properties.id `;
  if (options.minimum_rating) {
    queryParams.push(parseInt(options.minimum_rating));
    queryString += `HAVING avg(rating) >= $${queryParams.length}`;
  }
  queryParams.push(limit);
  queryString += `ORDER BY cost_per_night
  LIMIT $${queryParams.length};
`;
  // queryParams.push(limit);
  // queryString += `
  // GROUP BY properties.id
  // ORDER BY cost_per_night
  // LIMIT $${queryParams.length};
  // `;

  // 5
  console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams).then((res) => res.rows);
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
// const addProperty = function(property) {
//   const propertyId = Object.keys(properties).length + 1;
//   property.id = propertyId;
//   properties[propertyId] = property;
//   return Promise.resolve(property);
// };
const addProperty = function(property) {
  return pool
    .query(
      `INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;`,
      [
        property.owner_id,
        property.title,
        property.description,
        property.thumbnail_photo_url,
        property.cover_photo_url,
        property.cost_per_night,
        property.street,
        property.city,
        property.province,
        property.post_code,
        property.country,
        property.parking_spaces,
        property.number_of_bathrooms,
        property.number_of_bedrooms,
      ]
    )
    .then((result) => {
      console.log(result.rows[0]);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.addProperty = addProperty;
