'use strict';
(function () {
    var mongoose = require('mongoose');
    mongoose.Promise = require('bluebird');
    module.exports = {

        getPrimaryKeyType: function () {
            return mongoose.Schema.ObjectId;
        },

        getSchema: function (schemaObject) {
            return new mongoose.Schema(schemaObject);
        },

        createModel: function (modelName, schemaObject, indexObject, collection) {
            var modelSchema = new mongoose.Schema(schemaObject);
            if (indexObject) {
                modelSchema.index(indexObject);
            }
            return collection ? mongoose.model(modelName, modelSchema, collection) : mongoose.model(modelName, modelSchema);
        },

        getModel: function (modelName) {
            var model = null;
            try {
                model = mongoose.model(modelName);
                return model;
            } catch (error) {
                throw error;
            }
        },

        close: function (returnObj) {
            return new Promise(function (resolve, reject) {
                try {
                    mongoose.disconnect(function () {
                        resolve(returnObj);
                    })
                } catch (error) {
                    reject(error);
                }
            });
        },
        connect: function (connectionString, options) {
            options = {
                server: {
                    // sets how many times to try reconnecting
                    reconnectTries: Number.MAX_VALUE,
                    // sets the delay between every retry (milliseconds)
                    reconnectInterval: 1000
                }
            };
            try {
                return mongoose.connect(connectionString, options);
             }
            catch (error) { 
                return new Promise(resolve => resolve());
            }

        },

        insert: function (model, doc) {
           
            return new Promise(function (resolve, reject) {
                model.create(doc, function (error, data) {            
                    if (error)
                        console.log(error)
                        reject(error);                   
                    resolve(data);
                })
            })
        },
        remove: function (model, conditions) {
            return new Promise(function (resolve, reject) {
                model.remove(conditions, function (error) {
                    if (error)
                        reject(error);
                    resolve();
                })
            })
        }

    }
}());