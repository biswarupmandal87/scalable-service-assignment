const { body, query, param } = require("express-validator");
exports.validate = (method) => {
    switch (method) {
        case "addProject":
            {
                return [
                    body("title", "Title cannot be empty.").exists().notEmpty(),
                    body("description", "Description cannot be empty.").exists().notEmpty(),
                    body("start_date", "Start date cannot be empty").exists().notEmpty(),
                    body("end_date", "End date cannot be empty").exists().notEmpty(),
                ];
            }
        case "updateProject":
            {
                return [
                    body("title", "Title cannot be empty.").exists().notEmpty(),
                    body("description", "Description cannot be empty.").exists().notEmpty(),
                    body("start_date", "Start date cannot be empty").exists().notEmpty(),
                    body("end_date", "End date cannot be empty").exists().notEmpty(),
                ];
            }
    }
}