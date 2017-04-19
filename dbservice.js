'use strict';
(function () {
    let dbHelper = require('./mgDbHelper');

    module.exports = {

        getPrimaryKeyType: function () {
            return dbHelper.getPrimaryKeyType();
        },

        createEntityDef: function (entityStructure) {
            return dbHelper.getSchema(entityStructure);
        },

        createModel: function (modelName, entityDef, indexObject, collection) {
            return dbHelper.createModel(modelName, entityDef, indexObject, collection);
        },

        connectDb: function (connectionString, options) {
            return dbHelper.connect(connectionString, options);
        },

        disconnectDb: function (returnObj) {
            return dbHelper.close(returnObj);
        },

        getModel: function (modelName) {
            return dbHelper.getModel(modelName);
        },


        query: function (model, condition, options, limitStart, limit) {

            if (limit > 0) {
                return dbHelper.querylimit(model, condition, limitStart, limit);
            }
            return dbHelper.query(model, condition, options);
        },
        queryaggregate: function (model, condition, limit) {
            return dbHelper.queryaggregate(model, condition, limit);
        },

        querySort: function (model, condition, options, sort, limitStart, limit) {

            if (limit > 0) {
                return dbHelper.querysortlimit(model, condition, sort, limitStart, limit);
            }
            return dbHelper.querysort(model, condition, options, sort);
        },

        distinct: function (model, conditons, projection, options, distinctKey) {
            return dbHelper.distinct(model, conditons, projection, options, distinctKey);
        },

        insert: function (model, object) {
            return dbHelper.insert(model, object);
        },

        remove: function (model, conditions) {
            return dbHelper.remove(model, conditions);
        }


    };

}())