/*
 * Simple RegExp based router. Insprired by simplicity of http://github.com/defrex/node.routes.js.git
 */
exports.Routes = function(locations, nextApp){
	// precompile regexp on the first call
	for (var i = 0, l = locations.length; i < l; ++i) {
		var location = locations[i];
		if (typeof location.regexp === 'string') {
			var named_param_regex = /\/:(\w+)/g;
			var s = location.regexp.replace(named_param_regex, '(?:/([^\/]+)|/)');
			// if location.regexp contains grouping -- make it regexp
			// otherwise leave it as literal string
			if (s !== location.regexp)
				location.regexp = new RegExp('^' + s + '$');
		}
	}
	return function(request){
		for (var i = 0, l = locations.length; i < l; ++i) {
			var location = locations[i];
			// try to match the pattern, first literally, then as regular expression
			var args = (request.pathInfo === location.regexp) ? [] :
				(location.regexp instanceof RegExp) && location.regexp.exec(request.pathInfo);
			if (args) {
				// simple redirect?
				if (location.redirect)
					// yes. redirect to target
					return require('jack/redirect').Redirect(location.redirect)(request);
				// no. call a function
				// collect arguments
				args.shift(); // kick off the pattern itself
				// append predefined arguments
				if (args instanceof Array)
					args = args.concat(location.args);
				// prepend with middleware info
				args.unshift(request, nextApp);
				// N.B. args are request, nextApp, all-caught-from-regexp, location.args
				// N.B. location.handler should behave as vanilla middleware
				if (typeof location.handler === 'function') {
					return location.handler.apply(this, args);
				}
			}
		}
		return nextApp(request);
	};
};