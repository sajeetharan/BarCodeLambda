module.exports = function (dbService) {
	var model = null;
	var modelName = '_uploadInfo';

	try {
		model = dbService.getModel(modelName);
	} catch (error) {
		var detailsSchema = dbService.createEntityDef({
			Type: {
				type: String
			},
			Page: {
				type: String
			},
			Path: {
				type:String
			},
			Id:{
				type:String
			},
			ValidTicket:{
				type:Boolean
			}
		});
		var ticketSchema = dbService.createEntityDef({
			TicketName: {
				type: String
			},
			 
			TicketPath: {
				type: String
			},
			 
			Ticketpages: {
				type:  [detailsSchema]
			}


		});
		var uploadInfoSchema = {

			ProcessId: {
				type: String
			},
			Type: {
				type: String
			},
			ModifiedDate: {
				type: Date
			},
			Status: {
				type: String
			},
			Message: {
				type: String
			},
			Details: {
				type: ticketSchema
			}
		};
		model = dbService.createModel(modelName, uploadInfoSchema, null, modelName);
	}

	return model;
};