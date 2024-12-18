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

import { FileData } from "./file-data";

declare global {
    interface Window {
        showOpenFilePicker(options?: any): Promise<[any]>;
        showSaveFilePicker(options?: any): Promise<any>;
    }
}

/**
 * Utility methods used by the project library
 * @namespace
 */
export module TodoTxtUtils {
    /**
     * function will format a Date object to a string of YYYY-MM-DD
     * @returns {string} formatted date
     */
    export function formatDate(dateObj: Date): string {
        var yyyy = dateObj.getFullYear();
        var mm = (dateObj.getMonth()+1).toString(); // getMonth() is zero-based
        mm = mm.length < 2 ? "0" + mm : mm;
        var dd  = (dateObj.getDate()).toString();
        dd = dd.length < 2 ? "0" + dd : dd;
        return String(yyyy + "-" + mm + "-" + dd); // Leading zeros for mm and dd
    }

    /**
     * function will get the current browser language-locale
     * @returns {string} a ISO language-locale for the browser
     */
    export function getLanguage(): string {
        var langLocale = window.navigator["userLanguage"] || window.navigator.language;
        return langLocale.toLowerCase();
    }

    /**
     * function generates a GUID
     * @returns {string} a GUID (NNNNNNNN-NNNN-NNNN-NNNN-NNNNNNNNNNNN)
     */
    export function guid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * function will strip out any characters from the passed in string that are
     * not compatible with html and replace with html-friendly versions
     * @param {string} str - the string to be html encoded
     * @returns {string} a html encoded version of the string that can be used safely
     * within a html page
     */
    export function htmlEncode(str: string): string {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/\s{2}/g, ' &nbsp;');
    }

    /**
     * function will strip out any characters from the passed in string that are
     * html character entities and replace with standard string versions
     * @param {string} str - the string to be html unencoded
     * @returns {string} a version of the string that can contains non-html-friendly
     * strings
     */
    export function htmlUnencode(str: string): string {
        return String(str)
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&nbsp;/g, ' ');
    }

    let readable = null;
    let writable = null;

    export async function readFile(): Promise<FileData> {
        try {
            let handle = readable;
            const file = await handle.getFile();
            const text = await file.text();
            return {text: text, name: file.name, path: file.webkitRelativePath, size: file.size, lastModified: file.lastModified};
        } catch (error) {
            let [handle] = await window.showOpenFilePicker();
            readable = handle;
            const file = await handle.getFile();
            const text = await file.text();
            return {text: text, name: file.name, path: file.webkitRelativePath, size: file.size, lastModified: file.lastModified};
        }
    }

    export async function saveToFile(data: FileData): Promise<void> {
        try {
            let handle = writable;
            const file = await handle.createWritable();
            await file.write(data.text || '');
            await file.close();
        } catch (error) {
            const options = {
                suggestedName: data.name || 'todo.txt',
                types: [
                  {
                    description: "ToDo.txt file",
                    accept: {
                      "text/plain": [".txt"],
                    },
                  },
                ],
              };
            const handle = await window.showSaveFilePicker(options);
            writable = handle;
            const file = await handle.createWritable();
            await file.write(data.text || '');
            await file.close();
        }
    }
}