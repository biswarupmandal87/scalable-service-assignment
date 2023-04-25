const { body, query, param } = require("express-validator");
exports.validate = (method) => {
    switch (method) {
        case "adminRegister":
            {
                return [
                    body("first_name", "First Name cannot be empty.").exists().notEmpty(),
                    body("last_name", "Last Name cannot be empty.").exists().notEmpty(),
                    body("email", "Email cannot be empty").exists().notEmpty(),
                    body("email", "Invalid email").isEmail(),
                    body("password", "Password should have min 6 and max 15 characters.")
                        .exists()
                        .isLength({ min: 6, max: 15 }),
                ];
            }
        case "adminLogin":
            {
                return [
                    body("email", "Email cannot be empty").exists().notEmpty(),
                    body("email", "Invalid email").isEmail(),
                    body("password", "Password should have min 6 and max 15 characters.")
                        .exists()
                        .isLength({ min: 6, max: 15 }),
                ];
            }
        case "changePassword":
            {
                return [
                    body("new_password", "New Password should have min 6 and max 15 characters.").exists().isLength({ min: 6, max: 15 }),
                ];
            }
    }
}