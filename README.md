# Todo.txt web UI ![build status](https://github.com/basamykin/todoTxtWebUi/actions/workflows/pages/pages-build-deployment/badge.svg)

## Description

A web UI to work with a [todo.txt](http://www.todotxt.com) file. No back-end server code, no local executables, no browser plugins.

[Live demo](basamykin.github.io/todo/)

Making this, I was impressed by Sleek, because it allows mix together GTD and the Eisenhower Matrix, but also I wanted something (1) deployable on a free hosting and (2) something I can hack for my needs.

## Features

- Import and export of todo.txt file
- Tasks stored in the browser's localStorage and survive page reloads
- Allows creating of new tasks
- Allows editing of current task list
- Allows deleting of existing tasks
- Allows filtering of the displayed list of tasks by Priority, Project and Context
- Supports h:1 tag (items with this tag are sorted down, like "hidden")
- Supports due: and rec: tags for deferred tasks
- Auto sorting moves urgent tasks to the top
- Hide closed/hidden/future tasks

## Roadmap
- make links active
- make project/context regexes allow any non-white-char symbol
- autosave file

## Notes
- if you are tracking more than 1000 Tasks, the performance will start to degrade (~5 seconds per add / edit / delete operation)
- it is not recommended to track more than 5000 Tasks
- exporting your _todo.txt_ file will only include the currently visible tasks so exporting and re-importing can serve as a way of keeping the number of tracked tasks under control if you export when closed tasks are not visible

## Credits

Based on excellent work of Jason Holt Smith (<bicarbon8@gmail.com>) at https://github.com/bicarbon8/todoTxtWebUi.