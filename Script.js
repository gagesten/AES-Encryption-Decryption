var encryptRequest = function(request, hashval)
{
	var newRequest = {};
	var hash = this.toSHA256(request);
	var keyvalue = {};
	keyvalue.key = hash.toString();
	keyvalue.mkey = hashval.toString();
	request = JSON.parse(request);
	request.keyvalue = keyvalue;
	request = JSON.stringify(request);
	var embeddedRequest = this.base64Encode(request);
	newRequest.request = embeddedRequest;
	return embeddedRequest;
}

var toJMeter = {
	encryptRequest: encryptRequest,
	toSHA256: toSHA256,
	base64Encode: base64Encode,
	postRequest: postRequest,
	encode: encode,
	_utf8_encode: _utf8_encode,
	decodeBase64: decodeBase64,
	decode: decode
};

props.put("toJMeter", toJMeter);

var toSHA256 = function(string)
{
	if (string)
	{
		var shaHashed = CryptoJS.SHA256(string);
		return shaHashed;
	}
	
	else
	{
		return '';
	}
}

var base64Encode = function(string)
{
	if (string)
	{
		if (!window.btoa)
		{
			var base64Str = this.encode(string);
			return base64Str;
		}
		
		else
		{
			var base64Str = btoa(string);
			return base64Str;
		}
	}
	
	else
	{
		return '';
	}
}

var postRequest = function(requestObj, successCallback, errorCallback, url, options, object)
{
	sourceName = this.requestURL(url, options);
	var customIndicator = options.customIndicator || false;
	var customErrorHandling = options.customErrorHandling || false;

	if (!customIndicator)
	{
		this.totalRequest++;
		$(".loaderOverlay").css("display", "block");
	}
	var that = this;
	var ajaxParams;
	var header = options.header ? options.header :
	{
		'X-Requested-With': 'XMLHttpRequest'
	};
	var defaultContentType = 'application/json; charset=utf-8';
	var _contentType = options.contentType ? options.contentType : defaultContentType;
	
	if (!(options.parsingNotRequired) && _contentType == defaultContentType)
	{
		
	}
	var modifiedrequestObj = sandbox.root.utils.encryptRequest(requestObj);
	modifiedrequestObj = JSON.stringify(modifiedrequestObj);
	modifiedrequestObj = modifiedrequestObj ? modifiedrequestObj : '{}';
	
	if (cpEnv_Web.webIntegration && _contentType == 'multipart/form-data')
	{
		modifiedrequestObj = this.multipartData(options, header, modifiedrequestObj);
		_contentType = 'multipart/form-data; boundary=' + this.multiPartboundary;
	}

	ajaxParams = {
		type: "POST",
		url: sourceName,
		data: modifiedrequestObj,
		dataType: 'json',
		contentType: _contentType,
		headers: header
	};

	if (options.processDataNotReq)
	{
		ajaxParams['processData'] = false;
	}

	$.ajax(ajaxParams).done(
		function(json, textStatus, jqXHR)
		{
			if (jqXHR.status === 200)
			{
				if (!customIndicator)
				{
					that.totalRequest--;
					
					if (that.totalRequest == 0)
						$(".loaderOverlay").css("display", "none");
				}
				var result = json;
				var validJSON = false;
				var errorMessage = sandbox.data.cpLanguageMapping.getLabelForKey('cp.general.error');
				
				if (json && json.response)
				{
					var base64Decodedresult = '', hash = '', computeHashSorce = '';
					
					if (requestObj && requestObj.inputRequest.action.criterion !== 'retrieveLanguageMapping')
					{
						base64Decodedresult = sandbox.root.utils.decodeBase64(result.response);
						
						try
						{
							result = JSON.parse(base64Decodedresult);
						}
						
						catch (e)
						{
							var error = {};
							error.errorResponse = {};
							error.errorResponse.errorMessage = 'Request Failed';
							errorCallback.call(object, error);
							return;
						}

						if (result && result.keyvalue && result.keyvalue.key)
						{
							hash = result.keyvalue.key;
							delete result.keyvalue;
							computeHashSorce = base64Decodedresult.substring(0, base64Decodedresult.indexOf("keyvalue") - 2) + "}";
							var computedHash = sandbox.root.utils.toSHA256(computeHashSorce);
							
							if (hash != computedHash)
							{
								var error = {};
								error.errorResponse = {};
								error.errorResponse.errorMessage = 'Request Failed';
								errorCallback.call(object, error);
								return;
							}
						}
					}
				}
					
				if (typeof result === 'object')
				{
					validJSON = true;
				}
					
				else
				{
					try
					{
						result = JSON.parse(result);
						validJSON = true;
					}
					
					catch (e)
					{
						validJSON = false;
					}
				}

				if (validJSON && result && (result.successResponse || result.errorResponse))
				{
					successCallback.call(object, result);
				}
					
				else
				{
					if (errorCallback)
					{
						var error = {};
						error.errorResponse = {};
						error.errorResponse.errorMessage = errorMessage;
						errorCallback.call(object, error);
					}
				}
			}
				
			else
			{
				if (errorCallback)
				{
					var error = {};
					error.errorResponse = {};
					error.errorResponse.errorMessage = errorMessage;
					errorCallback.call(object, error);
				}
			}
		}
	)
	
	.fail(
		function(jqXHR, textStatus, errorThrown)
		{
			if (!customIndicator)
			{
				that.totalRequest--;
					
				if (that.totalRequest == 0)
					$(".loaderOverlay").css("display", "none");
			}
				
			if (jqXHR.status === 0)
			{
				message = "No network found, please verify.";
			}
				
			else if (jqXHR.status == 404)
			{
				message = "Requested page not found. [404].";
			}
				
			else if (jqXHR.status == 500)
			{
				message = 'Internal Server Error [500].';
			}
				
			else if (textStatus === 'parsererror')
			{
				message = 'Requested JSON parse failed.';
			}
				
			else if (textStatus === 'timeout')
			{
				message = 'Time out error.';
			}
				
			else if (textStatus === 'abort')
			{
				message = 'Ajax request aborted.';
			}
				
			else
			{
				message = jqXHR.status + ' ' + errorThrown;
			}
			
			var error = {};
			error.errorResponse = {};
			error.errorResponse.errorMessage = message;
			
			if (errorCallback)
			{
				errorCallback.call(object, error);
			}
		}
	);
}

var encode = function(input)
{
	var output = "";
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var i = 0;
	var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

	input = this._utf8_encode(input);

	while (i < input.length)
	{
		chr1 = input.charCodeAt(i++);
		chr2 = input.charCodeAt(i++);
		chr3 = input.charCodeAt(i++);

		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;

		if (isNaN(chr2))
		{
			enc3 = enc4 = 64;
		}
		
		else if (isNaN(chr3))
		{
			enc4 = 64;
		}

		output = output + _keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
	}

	return output;
}

var _utf8_encode = function(string)
{
	string = string.replace(/\r\n/g, "\n");
	var utftext = "";

	for (var n = 0; n < string.length; n++)
	{
		var c = string.charCodeAt(n);

		if (c < 128)
		{
			utftext += String.fromCharCode(c);
		}
		
		else if ((c > 127) && (c < 2048))
		{
			utftext += String.fromCharCode((c >> 6) | 192);
			utftext += String.fromCharCode((c & 63) | 128);
		}
		
		else
		{
			utftext += String.fromCharCode((c >> 12) | 224);
			utftext += String.fromCharCode(((c >> 6) & 63) | 128);
			utftext += String.fromCharCode((c & 63) | 128);
		}
	}
	return utftext;
}

var decodeBase64 = function(base64Encoded)
{
	if (base64Encoded)
	{
		if (!window.atob)
		{
			var originalString = this.decode(base64Encoded);
			return originalString;
		}
		
		else
		{
			var originalString = atob(base64Encoded);
			return originalString;
		}
	}
	return '';
}

var decode = function(input)
{
	var output = "";
	var chr1, chr2, chr3;
	var enc1, enc2, enc3, enc4;
	var i = 0;

	input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

	while (i < input.length)
	{
		enc1 = this._keyStr.indexOf(input.charAt(i++));
		enc2 = this._keyStr.indexOf(input.charAt(i++));
		enc3 = this._keyStr.indexOf(input.charAt(i++));
		enc4 = this._keyStr.indexOf(input.charAt(i++));

		chr1 = (enc1 << 2) | (enc2 >> 4);
		chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		chr3 = ((enc3 & 3) << 6) | enc4;

		output = output + String.fromCharCode(chr1);

		if (enc3 != 64)
		{
			output = output + String.fromCharCode(chr2);
		}
		
		if (enc4 != 64)
		{
			output = output + String.fromCharCode(chr3);
		}
	}
	output = Base64._utf8_decode(output);
	return output;
}