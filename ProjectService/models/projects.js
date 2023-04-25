const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2');
const ShortUniqueId = require('short-unique-id');
const uid = new ShortUniqueId({ length: 16 });
var projectShema = new Schema({
    _id: {
        type: String,
        default: () => {
            return uid();
        },
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    owner_id:{
        type: String,
        ref: "Users",
    },
    is_enabled: {
        type: Boolean,
        default: false
    },
    start_date: {
        type: Date,
        required: true,
        default: new Date()
    },
    end_date: {
        type: Date,
        required: true,
        default: new Date()
    }
}, {
    collection: 'Projects',
    timestamps: { createdAt: '_created', updatedAt: '_updated' },
    typecast: true
});

projectShema.plugin(mongoosePaginate);
module.exports = mongoose.model('Projects', projectShema);