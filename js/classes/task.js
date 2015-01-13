/**********************************************************************
 * This javascript was created according to the specifications at
 * http://todotxt.com/ and is intended to allow users to access their
 * todo.txt files in a user-friendly and easy to visualize manner.
 *
 * Once initially uploaded, the todo.txt file will
 * be loaded into an HTML5 localStorage and managed from there.
 * The web page then allows downloading changes back to the user
 * in a txt format compliant with the todo.txt specifications, but
 * having re-sorted the tasks.
 * 
 * @Created: 08/14/2012
 * @Author: Jason Holt Smith (bicarbon8@gmail.com)
 * @Version: 0.0.1
 * Copyright (c) 2012 Jason Holt Smith. todoTxtWebUi is distributed under
 * the terms of the GNU General Public License.
 * 
 * This file is part of todoTxtWebUi.
 * 
 * todoTxtWebUi is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * todoTxtWebUi is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with todoTxtWebUi.  If not, see <http://www.gnu.org/licenses/>.
 **********************************************************************/
var TodoTxt = TodoTxt || {};
/**
 * this represents a TodoTxt.Task Class to be used as a container for metadata 
 * about some type of object.  In this case that object is a
 * task. the constructor will create a new taskObj populated with all it's data.
 * The format expected is as follows:
 * <p>Active: '[createdDate ]task text string'<br />
 * Closed: 'x closedDate [createdDate ]task text string'</p>
 * where a closed date should only exist if the task is closed
 * 
 * @constructor
 * @param {string} [taskString=""] - taskString a single line from the todo.txt file to be parsed
 * into a Task Object
 */
TodoTxt.Task = function (taskString) {
	/** @ignore */
	this.namespace = TodoTxt.namespace + "Task.";
	/**
	 * an autogenerated unique identifier
	 * @type {string}
	 * @defaultvalue GUID
	 */
	this.id = this.namespace + TodoTxt.Utils.guid();
	/**
	 * a string of the format <i>(A)</i> representing the task priority
	 * @type {string}
	 * @defaultvalue null
	 */
	this.priority = null;
	/**
	 * string of the format <i>YYYY-MM-DD</i> representing the task created date
	 * @type {string}
	 * @defaultvalue null 
	 */
	this.createdDate = null;
	/**
	 * string of the format <i>YYYY-MM-DD</i> that is only present on closed tasks
	 * @type {string}
	 * @defaultvalue null
	 */
	this.completedDate = null;
	/**
	 * array of strings for words starting with <b><i>+</i></b> representing any projects
	 * in this task
	 * @type {array}
	 * @defaultvalue []
	 */
	this.projects = [];
	/**
	 * array of strings for words starting with <b><i>@</i></b> representing any contexts
	 * in this task
	 * @type {array}
	 * @defaultvalue []
	 */
	this.contexts = [];
	/**
	 * additional metadata in the form of <b><i>key:value</b></i>
	 * @type {array}
	 * @defaultvalue []
	 */
	this.metadatas = [];
	/**
	 * flag to indicate task status
	 * @type {boolean}
	 * @defaultvalue true
	 */
	this.isActive = true;
	/**
	 * full, raw task text string
	 * @type {string}
	 * @defaultvalue ""
	 */
	this.text = "";

	if (taskString) {
		this._parseFromString(taskString);
	}
};

/** @ignore */
TodoTxt.Task.prototype._parseFromString = function (textLine) {
	if (typeof textLine === "string") {
		// assign the text
		this.text = textLine;

		// parse out the Active / Closed state (starts with "x " for closed)
		this._parseStatusFromString(textLine);

		// get the priority of the task EX: (A)
		this._parsePriorityFromString(textLine);
		
		// get the completed date of the task EX: 2012-09-23
		this._parseCompletedDateFromString(textLine);
		
		// get the created date of the task EX: 2012-09-23
		this._parseCreatedDateFromString(textLine);
		
		// parse out any Projects (items starting with "+" like "+ProjectName")
		this._parseProjectsFromString(textLine);
		
		// parse out any Context (items starting with "@" like "@ContextName")
		this._parseContextsFromString(textLine);
	} else {
		throw "cannot parse input of type: " + typeof(textLine) + ". only strings are accepted.";
	}
};

/** @ignore */
TodoTxt.Task.prototype._parseStatusFromString = function (str) {
	// check for strings starting with something like "x "
	if (str && str.match(/^(x )/)) {
		this.isActive = false;
	} else {
		this.isActive = true;
	}
};

/** @ignore */
TodoTxt.Task.prototype._parsePriorityFromString = function (str) {
	var pri = null; // used to hold the priority if set
	if (str) {
		// parse out the priority RegEx: /\^([A-Z]\).*/ 
		// check for strings starting with something like "(A) "
		var priPattern = /^(\([A-Z]\)[\s]+)/;
		var match = str.match(priPattern); // returns null if not found
		if (match) {
			// found an active match so get the priority
			pri = match[0].replace(/[\s]*/g, "");
		}
	}
	
	this.priority = pri;
};

/** @ignore */
TodoTxt.Task.prototype._parseCompletedDateFromString = function (str) {
	var completed = null;
	if (str) {
		// parse out the completedDate if closed (starts with "x ")
		if (!this.isActive) {
			var dates = this._parseDatesFromString(str);
			if (dates) {
				completed = dates[0].replace(/[\s]*/g, "");
			}
		}
	}
	
	this.completedDate = completed;
};

/** @ignore */
TodoTxt.Task.prototype._parseCreatedDateFromString = function (str) {
	var created = null;
	if (str) {
		// parse out the createdDate (will be 2nd if item is closed)
		var dates = this._parseDatesFromString(str);
		if (dates) {
			if (!this.isActive) {
				if (dates.length > 1) { // we have created and completed
					created = dates[1].replace(/[\s]*/g, "");
				}
			} else {
				created = dates[0].replace(/[\s]*/g, "");
			}
		}
	}
	
	this.createdDate = created;
};

/** @ignore */
TodoTxt.Task.prototype._parseDatesFromString = function (str) {
	var dates = null;
	if (str) {
		// check for strings with something like "2012-08-09"
		var datePattern = /(?:\s|^)(\d{4}-\d{2}-\d{2})(?=\s)/g;
		match = str.match(datePattern); // returns null if not found
		if (match) {
			dates = match;
		}
	}
	
	return dates;
};

/** @ignore */
TodoTxt.Task.prototype._parseProjectsFromString = function (str) {
	var projArray = []; // used to hold the project if set
	if (str) {
		// parse out the projects RegEx: /\+[0-9A-Za-z]+\s/ (words starting with "+")
		// check for strings like "+ABC123"
		var projPattern = /((\s|^)[\(\{\["']?\+[0-9A-Za-z]+[\)\}\]"']?( |$))/g;
		var match = str.match(projPattern); // returns null if not found
		if (match) {
			// found an active match so get the projects as an array of projects
			projArray = match.map(function (p) {
				return p.replace(/[\s]*/g, "").replace(/[\(\{\[\)\}\]"']/g, "");
			});
		}
	}
	
	this.projects = projArray;
};

/** @ignore */
TodoTxt.Task.prototype._parseContextsFromString = function (str) {
	var ctxArray = []; // used to hold the context if set
	if (str) {
		// parse out the contexts RegEx: /\@[0-9A-Za-z]+\s/ (words starting with "+")
		// check for strings like "@ABC123"
		var ctxPattern = /((\s|^)[\(\{\["']?\@[0-9A-Za-z]+[\)\}\]"']?( |$))/g;
		var match = str.match(ctxPattern); // returns null if not found
		if (match) {
			// found an active match so get the contexts as an array of contexts
			ctxArray = match.map(function (p) {
				return p.replace(/[\s]*/g, "").replace(/[\(\{\[\)\}\]"']/g, "");
			});
		}
	}
	
	this.contexts = ctxArray;
};

/**
 * override toString() to output the raw TodoTxt format
 */
TodoTxt.Task.prototype.toString = function () {
	return this.text;
};