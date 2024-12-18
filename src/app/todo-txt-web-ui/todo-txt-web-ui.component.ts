import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';
import { TodoTxtUtils } from './helpers/todo-txt-utils';
import { TodoTxtConfig } from './storage/todo-txt-config';
import { TodoTxtVault } from './storage/todo-txt-vault';
import { TodoTxtTask } from './tasks/todo-txt-task';
import { TodoTxtTaskParser } from './tasks/todo-txt-task-parser';
import { TodoTxt } from './todo-txt';
import { saveAs } from 'file-saver';
import { TodoTxtAttributes } from './tasks/todo-txt-attributes';
import { FileData } from './helpers/file-data';

@Component({
  selector: 'app-todo-txt-web-ui',
  templateUrl: './todo-txt-web-ui.component.html',
  styleUrls: ['./todo-txt-web-ui.component.css']
})
export class TodoTxtWebUiComponent {
  requiredFileType: string = '.txt';
  fileName: string;
  downloadFileName: string;
  isDirty: boolean;
  showClosed: boolean;
  showHidden: boolean;
  showFuture: boolean;
  downloadUrl: SafeUrl;
  filterStr: string;
  editingTaskId: string;
  isAddingNew: boolean;
  lastModified: number;

  constructor(private sanitiser: DomSanitizer, private changeDetector: ChangeDetectorRef) {
    this.isDirty = false;
    this.showClosed = TodoTxtVault.getConfig().showClosed;
    this.showHidden = TodoTxtVault.getConfig().showHidden;
    this.showFuture = TodoTxtVault.getConfig().showFuture;
    this.downloadFileName = 'todo.txt';
  }

  async toggleShowClosed(): Promise<void> {
    let cfg: TodoTxtConfig = TodoTxtVault.getConfig();
    cfg.showClosed = !cfg.showClosed;
    this.showClosed = cfg.showClosed;
    TodoTxtVault.setConfig(cfg);
  }

  async toggleShowHidden(): Promise<void> {
    let cfg: TodoTxtConfig = TodoTxtVault.getConfig();
    cfg.showHidden = !cfg.showHidden;
    this.showHidden = cfg.showHidden;
    TodoTxtVault.setConfig(cfg);
  }

  async toggleShowFuture(): Promise<void> {
    let cfg: TodoTxtConfig = TodoTxtVault.getConfig();
    cfg.showFuture = !cfg.showFuture;
    this.showFuture = cfg.showFuture;
    TodoTxtVault.setConfig(cfg);
  }

  async click_OpenToDoFile(): Promise<void> {
    const data: FileData = await TodoTxtUtils.readFile()
    .catch((err) => {
      if (err.name != 'AbortError') { // AbortError is manual user cancel of file save operation
        console.warn(`unable to use File System API so falling back to legacy mode: ${err}`);
        document.getElementById('file-input').click();
        return null;
      }
    });
    if (data) {
      if (this.lastModified && data.lastModified <= this.lastModified) {
        return; // no need to reload, if file wasn't changed externally
      }

      if (!this.lastModified) {
        setInterval(async () => {
          // fetch file
          const data: FileData = await TodoTxtUtils.readFile()
            .catch((err) => { console.log(2); return null; });
          if (data) {
            // check timestamp
            if (this.lastModified && data.lastModified <= this.lastModified) {
              return; // no need to reload, if file wasn't changed externally
            } else {
              this.click_OpenToDoFile();
            }
          }
        }, 10000);
      }

      this.fileName = data.name;
      this.lastModified = data.lastModified;
      let lines: string[] = data.text?.split('\n') || [];

      TodoTxtVault.removeAllTasks();
      TodoTxtVault.addTasks(...TodoTxtTaskParser.getMany(...lines));
    }
  }
  
  async processToDoFile(event: any): Promise<void> {
    if (event) {
      let files: File[] = event.target?.files;
      if (files && files.length > 0) {
        let file: File = files[0];
        if (file) {
          TodoTxtVault.removeAllTasks();
          this.fileName = file.name;
          let text: string = await file.text();
          let lines: string[] = text.split('\n');
          TodoTxtVault.addTasks(...TodoTxtTaskParser.getMany(...lines));
        }
      }
    }
  }

  async click_AddTask(): Promise<string> {
    this.isAddingNew = true;
    let t: TodoTxtTask = TodoTxtTaskParser.get('');
    TodoTxt.addTask(t);
    this.isDirty = true;
    return await this.click_StartEditTask(t.id);
  }

  async click_SaveTasks(): Promise<void> {
    // let text: string = this.getTasks().map((t) => t.text?.trim())?.join('\n');
    let text: string = TodoTxtVault.getAllTasks().map((t) => t.text?.trim())?.join('\n');
    if (text) {
      await TodoTxtUtils.saveToFile({text: text, name: this.fileName})
      .catch((err) => {
        if (err.name != 'AbortError') { // AbortError is manual user cancel of file save operation
          console.warn(`unable to use File System API so falling back to legacy mode: ${err}`);
          let blob = new Blob([text], { type: 'data:attachment/text; charset=utf-8' });
          saveAs(blob, this.downloadFileName);
        }
      });
    }
    this.lastModified = Date.now();
    this.isDirty = false;
  }

  async keyup_UpdateFilter(filter: string): Promise<void> {
    this.filterStr = filter;
  }

  async click_ClearFilter(event: any): Promise<void> {
    this.filterStr = null;
    event.target.value = undefined;
  }

  async click_MarkComplete(id: string): Promise<void> {
    TodoTxt.closeTask(id);
    this.click_SaveTasks();
  }

  async click_MarkActive(id: string): Promise<void> {
    TodoTxt.activateTask(id);
    this.click_SaveTasks();
  }
  
  async click_StartEditTask(id: string): Promise<string> {
    this.editingTaskId = id;
    this.changeDetector.detectChanges();
    return await this.setFocus(id);
  }

  async setFocus(id: string): Promise<string> {
    let el: HTMLElement = document.getElementById(`textarea_${id}`);
    if (el) {
      console.info(`setting focus on element 'textarea_${id}'`);
      el.focus();
      return id;
    } else {
      return Promise.reject(`unable to find element 'textarea_${id}'`);
    }
  }

  async click_SaveTaskEdit(id: string): Promise<string> {
    let text: string = document.querySelector<HTMLDivElement>(`#textarea_${id}`).innerText;
    TodoTxt.updateTask(id, text);
    this.isDirty = true;
    this.doneEditing();
    return text;
  }

  @HostListener('keydown.esc')
  async click_CancelTaskEdit(): Promise<void> {
    if (this.isAddingNew) {
      this.click_DeleteTask(this.editingTaskId);
    }
    this.doneEditing();
  }

  async click_DeleteTask(id: string): Promise<void> {
    TodoTxtVault.removeTask(id);
    this.isDirty = true;
    this.doneEditing();
  }

  doneEditing(): void {
    this.editingTaskId = null;
    this.isAddingNew = false;
    this.changeDetector.detectChanges();
    this.click_SaveTasks();
  }

  getTasks(): TodoTxtTask[] {
    let tasks: TodoTxtTask[] = TodoTxt.getFilteredTaskArray(this.filterStr);
    let showClosed = TodoTxtVault.getConfig().showClosed;
    let showHidden = TodoTxtVault.getConfig().showHidden;
    let showFuture = TodoTxtVault.getConfig().showFuture;

    
    let visible: TodoTxtTask[] = [];
    for (var i=0; i<tasks.length; i++) {
      if (!showClosed && !tasks[i].isActive) {
        continue;
      }

      if (!showHidden && tasks[i].h) {
        continue;
      }

      if (!showFuture && tasks[i].dueDate) {
        let todayDate = new Date();
        let today = todayDate.toISOString().split('T')[0];
        if (tasks[i].dueDate > today) {
          continue;
        }
      }

      visible.push(tasks[i]);
    }
    tasks = visible;
    return tasks;
  }

  /**
   * function will generate a html-markup version of the task
   * @param {TodoTxtTask} task - the task to generate for
   * @returns {string} the HTML marked up task text
   */
   getMarkupForTask(text: string): SafeHtml {
      let task: TodoTxtTask = TodoTxtTaskParser.get(text);
      // make html compatible
      text = TodoTxtUtils.htmlEncode(text);

      // markup priority
      let priCls: string = this.getDisplayClassForTask(task);
      text = text.replace(task.priority, "<span class=\"" + priCls + "\"><b>" + task.priority + "</b></span>");

      // markup projects
      let projects: string[] = task.projects;
      projects.forEach((project) => {
          var regex = new RegExp(project.replace(/\+/g, "\\+") + "(?![\S])", "g");
          text = text.replace(regex, "<span class=\"text-muted\"><b><i>" + project + "</i></b></span>");
      });

      // markup contexts
      let contexts: string[] = task.contexts;
      contexts.forEach((ctx) => {
          var regex = new RegExp(ctx + "(?![\S])", "g");
          text = text.replace(regex, "<span class=\"text-muted\"><b><i>" + ctx + "</i></b></span>");
      });

      // markup created date
      let date: string = task.createdDate;
      if (date) {
          text = text.replace(date, "<span class=\"text-muted hidden-xs\"><b><i>" + date + "</i></b></span>");
      }

      let dueDate: string = task.dueDate;
      if (dueDate) {
          let todayDate = new Date()
          let today = todayDate.toISOString().split('T')[0];
          if (today > dueDate) {
            text = text.replace(dueDate, "<span style=\"color: red;\"><b><i>" + dueDate + "</i></b></span>");
          } else if (today < dueDate) {
            text = text.replace(dueDate, "<span style=\"color: blue;\"><b><i>" + dueDate + "</i></b></span>");
          } else {
            text = text.replace(dueDate, "<span style=\"color: green;\"><b><i>" + dueDate + "</i></b></span>");
          }
      }

      return this.sanitiser.bypassSecurityTrustHtml(text);
  }
  
  getDisplayClassForTask(task: TodoTxtTask): string {
      let cls: string = '';
      if (task.priority !== null && task.isActive) {
          if (task.priority === "(A)") {
              cls += " text-danger";
          }
          if (task.priority === "(B)") {
              cls += " text-warning";
          }
          if (task.priority === "(C)") {
              cls += " text-primary";
          }
      }

      return cls;
  }

  getPriorities(): string[] {
    let pri = Array.from(TodoTxtAttributes.priorities)
    return pri.sort();
  }

  getProjects(): string[] {
    let proj = Array.from(TodoTxtAttributes.projects)
    return proj.sort();
  }

  getContexts(): string[] {
    let ctx = Array.from(TodoTxtAttributes.contexts)
    return ctx.sort();
  }
}
