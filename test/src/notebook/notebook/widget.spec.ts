// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import expect = require('expect.js');

import {
  Message
} from 'phosphor-messaging';

import {
  IChangedArgs
} from 'phosphor-properties';

import {
  ChildMessage
} from 'phosphor-widget';

import {
  simulate
} from 'simulate-event';

import {
  CodeCellModel, CodeCellWidget, MarkdownCellModel, MarkdownCellWidget,
  RawCellModel, RawCellWidget
} from '../../../../lib/notebook/cells';

import {
  INotebookModel, NotebookModel
} from '../../../../lib/notebook/notebook/model';

import {
  Notebook, StaticNotebook
} from '../../../../lib/notebook/notebook/widget';

import {
  defaultRenderMime
} from '../../rendermime/rendermime.spec';

import {
  DEFAULT_CONTENT
} from '../utils';


const rendermime = defaultRenderMime();


function createWidget(): LogStaticNotebook {
  let model = new NotebookModel();
  let widget = new LogStaticNotebook({ rendermime });
  widget.model = model;
  return widget;
}


class LogStaticNotebook extends StaticNotebook {

  methods: string[] = [];

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }

  protected onModelChanged(oldValue: INotebookModel, newValue: INotebookModel): void {
    super.onModelChanged(oldValue, newValue);
    this.methods.push('onModelChanged');
  }

  protected onMetadataChanged(model: INotebookModel, args: IChangedArgs<any>): void {
    super.onMetadataChanged(model, args);
    this.methods.push('onMetadataChanged');
  }
}


class LogNotebook extends Notebook {

  events: string[] = [];

  methods: string[] = [];

  handleEvent(event: Event): void {
    this.events.push(event.type);
    super.handleEvent(event);
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.methods.push('onAfterAttach');
  }

  protected onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.methods.push('onBeforeDetach');
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.methods.push('onUpdateRequest');
  }

  protected onChildAdded(msg: ChildMessage): void {
    super.onChildAdded(msg);
    this.methods.push('onChildAdded');
  }

  protected onChildRemoved(msg: ChildMessage): void {
    super.onChildRemoved(msg);
    this.methods.push('onChildRemoved');
  }
}


function createActiveWidget(): LogNotebook {
  let model = new NotebookModel();
  let widget = new LogNotebook({ rendermime });
  widget.model = model;
  return widget;
}


describe('notebook/notebook/widget', () => {

  describe('StaticNotebook', () => {

    describe('#constructor()', () => {

      it('should create a notebook widget', () => {
        let widget = new StaticNotebook({ rendermime });
        expect(widget).to.be.a(StaticNotebook);
      });

      it('should add the `jp-Notebook` class', () => {
        let widget = new StaticNotebook({ rendermime });
        expect(widget.hasClass('jp-Notebook')).to.be(true);
      });

      it('should accept an optional render', () => {
        let renderer = new StaticNotebook.Renderer();
        let widget = new StaticNotebook({ rendermime, renderer });
        expect(widget.renderer).to.be(renderer);
      });

    });

    describe('#modelChanged', () => {

      it('should be emitted when the model changes', () => {
        let widget = new StaticNotebook({ rendermime: defaultRenderMime() });
        let model = new NotebookModel();
        let called = false;
        widget.modelChanged.connect((sender, args) => {
          expect(sender).to.be(widget);
          expect(args).to.be(void 0);
          called = true;
        });
        widget.model = model;
        expect(called).to.be(true);
      });

    });

    describe('#model', () => {

      it('should get the model for the widget', () => {
        let widget = new StaticNotebook({ rendermime: defaultRenderMime() });
        expect(widget.model).to.be(null);
      });

      it('should set the model for the widget', () => {
        let widget = new StaticNotebook({ rendermime: defaultRenderMime() });
        let model = new NotebookModel();
        widget.model = model;
        expect(widget.model).to.be(model);
      });

      it('should emit the `modelChanged` signal', () => {
        let widget = new StaticNotebook({ rendermime: defaultRenderMime() });
        let model = new NotebookModel();
        widget.model = model;
        let called = false;
        widget.modelChanged.connect(() => { called = true; });
        widget.model = new NotebookModel();
        expect(called).to.be(true);
      });

      it('should be a no-op if the value does not change', () => {
        let widget = new StaticNotebook({ rendermime: defaultRenderMime() });
        let model = new NotebookModel();
        widget.model = model;
        let called = false;
        widget.modelChanged.connect(() => { called = true; });
        widget.model = model;
        expect(called).to.be(false);
      });

      it('should add the model cells to the layout', () => {
        let widget = new LogStaticNotebook({ rendermime: defaultRenderMime() });
        let model = new NotebookModel();
        model.fromJSON(DEFAULT_CONTENT);
        widget.model = model;
        expect(widget.childCount()).to.be(6);
      });

      it('should set the mime types of the cell widgets', () => {
        let widget = new LogStaticNotebook({ rendermime: defaultRenderMime() });
        let model = new NotebookModel();
        let cursor = model.getMetadata('language_info');
        cursor.setValue({ name: 'python', codemirror_mode: 'python' });
        widget.model = model;
        let child = widget.childAt(0);
        expect(child.mimetype).to.be('text/x-python');
      });

      context('`cells.changed` signal', () => {

        let widget: LogStaticNotebook;

        beforeEach(() => {
          widget = createWidget();
          widget.model.fromJSON(DEFAULT_CONTENT);
        });

        afterEach(() => {
          widget.dispose();
        });

        it('should handle changes to the model cell list', () => {
          widget = createWidget();
          widget.model.cells.clear();
          expect(widget.childCount()).to.be(0);
        });

        it('should handle a remove', () => {
          let cell = widget.model.cells.get(1);
          let child = widget.childAt(1);
          widget.model.cells.remove(cell);
          expect(cell.isDisposed).to.be(true);
          expect(child.isDisposed).to.be(true);
        });

        it('should handle an add', () => {
          let cell = widget.model.factory.createCodeCell();
          widget.model.cells.add(cell);
          expect(widget.childCount()).to.be(7);
          let child = widget.childAt(0);
          expect(child.hasClass('jp-Notebook-cell')).to.be(true);
        });

        it('should handle a move', () => {
          let child = widget.childAt(1);
          widget.model.cells.move(1, 2);
          expect(widget.childAt(2)).to.be(child);
        });

        it('should handle a replace', () => {
          let cell = widget.model.factory.createCodeCell();
          widget.model.cells.replace(0, 6, [cell]);
          expect(widget.childCount()).to.be(1);
        });

      });

    });

    describe('#rendermime', () => {

      it('should be the rendermime instance used by the widget', () => {
        let widget = new StaticNotebook({ rendermime });
        expect(widget.rendermime).to.be(rendermime);
      });

      it('should be read-only', () => {
        let widget = createWidget();
        expect(() => { widget.rendermime = null; }).to.throwError();
      });

    });

    describe('#renderer', () => {

      it('should be the cell widget renderer used by the widget', () => {
        let widget = new StaticNotebook({ rendermime });
        expect(widget.renderer).to.be(StaticNotebook.defaultRenderer);
      });

      it('should be read-only', () => {
        let widget = createWidget();
        expect(() => { widget.renderer = null; }).to.throwError();
      });

    });

    describe('#codeMimetype', () => {

      it('should get the mime type for code cells', () => {
        let widget = new StaticNotebook({ rendermime });
        expect(widget.codeMimetype).to.be('text/plain');
      });

      it('should be set from language metadata', () => {
        let widget = new LogStaticNotebook({ rendermime: defaultRenderMime() });
        let model = new NotebookModel();
        let cursor = model.getMetadata('language_info');
        cursor.setValue({ name: 'python', codemirror_mode: 'python' });
        widget.model = model;
        expect(widget.codeMimetype).to.be('text/x-python');
      });

    });

    describe('#childAt()', () => {

      it('should get the child widget at a specified index', () => {
        let widget = createWidget();
        let child = widget.childAt(0);
        expect(child).to.be.a(CodeCellWidget);
      });

      it('should return `undefined` if out of range', () => {
        let widget = createWidget();
        let child = widget.childAt(1);
        expect(child).to.be(void 0);
      });

    });

    describe('#childCount()', () => {

      it('should get the number of child widgets', () => {
        let widget = createWidget();
        expect(widget.childCount()).to.be(1);
        widget.model.fromJSON(DEFAULT_CONTENT);
        expect(widget.childCount()).to.be(6);
      });

    });

    describe('#dispose()', () => {

      it('should dispose of the resources held by the widget', () => {
        let widget = createWidget();
        let model = widget.model;
        widget.dispose();
        expect(widget.model).to.be(null);
        expect(model.isDisposed).to.be(false);
        expect(widget.rendermime).to.be(null);
      });

      it('should be safe to call multiple times', () => {
        let widget = createWidget();
        widget.dispose();
        widget.dispose();
        expect(widget.isDisposed).to.be(true);
      });

    });

    describe('#onModelChanged()', () => {

      it('should be called when the model changes', () => {
        let widget = new LogStaticNotebook({ rendermime });
        widget.model = new NotebookModel();
        expect(widget.methods).to.contain('onModelChanged');
      });

      it('should not be called if the model does not change', () => {
        let widget = createWidget();
        widget.methods = [];
        widget.model = widget.model;
        expect(widget.methods).to.not.contain('onModelChanged');
      });

    });

    describe('#onMetadataChanged()', () => {

      it('should be called when the metadata on the notebook changes', () => {
        let widget = createWidget();
        let cursor = widget.model.getMetadata('foo');
        cursor.setValue(1);
        expect(widget.methods).to.contain('onMetadataChanged');
      });

      it('should update the `codeMimetype`', () => {
        let widget = createWidget();
        let cursor = widget.model.getMetadata('language_info');
        cursor.setValue({ name: 'python', codemirror_mode: 'python' });
        expect(widget.methods).to.contain('onMetadataChanged');
        expect(widget.codeMimetype).to.be('text/x-python');
      });

      it('should update the cell widget mimetype', () => {
        let widget = createWidget();
        let cursor = widget.model.getMetadata('language_info');
        cursor.setValue({ name: 'python', mimetype: 'text/x-python' });
        expect(widget.methods).to.contain('onMetadataChanged');
        let child = widget.childAt(0);
        expect(child.mimetype).to.be('text/x-python');
      });

    });

    describe('.Renderer', () => {

      describe('#createCodeCell()', () => {

        it('should create a `CodeCellWidget`', () => {
          let renderer = new StaticNotebook.Renderer();
          let model = new CodeCellModel();
          let widget = renderer.createCodeCell(model, rendermime);
          expect(widget).to.be.a(CodeCellWidget);
        });

      });

      describe('#createMarkdownCell()', () => {

        it('should create a `MarkdownCellWidget`', () => {
          let renderer = new StaticNotebook.Renderer();
          let model = new MarkdownCellModel();
          let widget = renderer.createMarkdownCell(model, rendermime);
          expect(widget).to.be.a(MarkdownCellWidget);
        });

      });

      describe('#createRawCell()', () => {

        it('should create a `RawCellWidget`', () => {
          let renderer = new StaticNotebook.Renderer();
          let model = new RawCellModel();
          let widget = renderer.createRawCell(model);
          expect(widget).to.be.a(RawCellWidget);
        });

      });

      describe('#updateCell()', () => {

        it('should be a no-op', () => {
          let renderer = new StaticNotebook.Renderer();
          let model = new CodeCellModel();
          let widget = renderer.createCodeCell(model, rendermime);
          renderer.updateCell(widget);
          expect(widget).to.be.a(CodeCellWidget);
        });

      });

      describe('#getCodeMimetype()', () => {

        it('should get the preferred mime for code cells in the notebook', () => {
          let renderer = new StaticNotebook.Renderer();
          let model = new NotebookModel();
          let cursor = model.getMetadata('language_info');
          cursor.setValue({ name: 'python', mimetype: 'text/x-python' });
          expect(renderer.getCodeMimetype(model)).to.be('text/x-python');
        });

      });

    });

    describe('.defaultRenderer', () => {

      it('should be an instance of `StaticNotebook.Renderer', () => {
        expect(StaticNotebook.defaultRenderer).to.be.a(StaticNotebook.Renderer);
      });

    });

  });

  describe('Notebook', () => {

    describe('#stateChanged', () => {

      it('should be emitted when the state of the notebook changes', () => {
        let widget = createActiveWidget();
        let called = false;
        widget.stateChanged.connect((sender, args) => {
          expect(sender).to.be(widget);
          expect(args.name).to.be('mode');
          expect(args.oldValue).to.be('command');
          expect(args.newValue).to.be('edit');
          called = true;
        });
        widget.mode = 'edit';
        expect(called).to.be(true);
      });

    });

    describe('#mode', () => {

      it('should get the interactivity mode of the notebook', () => {
        let widget = createActiveWidget();
        expect(widget.mode).to.be('command');
      });

      it('should set the interactivity mode of the notebook', () => {
        let widget = createActiveWidget();
        widget.mode = 'edit';
        expect(widget.mode).to.be('edit');
      });

      it('should emit the `stateChanged` signal', () => {
        let widget = createActiveWidget();
        let called = false;
        widget.stateChanged.connect((sender, args) => {
          expect(sender).to.be(widget);
          expect(args.name).to.be('mode');
          expect(args.oldValue).to.be('command');
          expect(args.newValue).to.be('edit');
          called = true;
        });
        widget.mode = 'edit';
        expect(called).to.be(true);
      });

      it('should be a no-op if the value does not change', () => {
        let widget = createActiveWidget();
        let called = false;
        widget.stateChanged.connect(() => { called = true; });
        widget.mode = 'command';
        expect(called).to.be(false);
      });

      it('should post an update request', (done) => {
        let widget = createActiveWidget();
        requestAnimationFrame(() => {
          expect(widget.methods).to.contain('onUpdateRequest');
          done();
        });
        widget.mode = 'edit';
      });

      it('should deselect all cells if switching to edit mode', (done) => {
        let widget = createActiveWidget();
        widget.model.fromJSON(DEFAULT_CONTENT);
        widget.attach(document.body);
        requestAnimationFrame(() => {
          for (let i = 0; i < widget.childCount(); i++) {
            let cell = widget.childAt(i);
            widget.select(cell);
            expect(widget.isSelected(cell)).to.be(true);
          }
          widget.mode = 'edit';
          for (let i = 0; i < widget.childCount(); i++) {
            if (i === widget.activeCellIndex) {
              continue;
            }
            let cell = widget.childAt(i);
            expect(widget.isSelected(cell)).to.be(false);
          }
          widget.dispose();
          done();
        });

      });

    });

    describe('#activeCellIndex', () => {

      it('should get the active cell index of the notebook', () => {
        let widget = createActiveWidget();
        expect(widget.activeCellIndex).to.be(0);
      });

      it('should set the active cell index of the notebook', () => {
        let widget = createActiveWidget();
        widget.model.fromJSON(DEFAULT_CONTENT);
        widget.activeCellIndex = 1;
        expect(widget.activeCellIndex).to.be(1);
      });

      it('should clamp the index to the bounds of the notebook cells', () => {
        let widget = createActiveWidget();
        widget.model.fromJSON(DEFAULT_CONTENT);
        widget.activeCellIndex = -2;
        expect(widget.activeCellIndex).to.be(0);
        widget.activeCellIndex = 100;
        expect(widget.activeCellIndex).to.be(5);
      });

      it('should emit the `stateChanged` signal', () => {
        let widget = createActiveWidget();
        let called = false;
        widget.model.fromJSON(DEFAULT_CONTENT);
        widget.stateChanged.connect((sender, args) => {
          expect(sender).to.be(widget);
          expect(args.name).to.be('activeCellIndex');
          expect(args.oldValue).to.be(0);
          expect(args.newValue).to.be(1);
          called = true;
        });
        widget.activeCellIndex = 1;
        expect(called).to.be(true);
      });

      it('should be a no-op if the value does not change', () => {
        let widget = createActiveWidget();
        let called = false;
        widget.model.fromJSON(DEFAULT_CONTENT);
        widget.stateChanged.connect(() => { called = true; });
        widget.activeCellIndex = 0;
        expect(called).to.be(false);
      });

      it('should post an update request', (done) => {
        let widget = createActiveWidget();
        widget.model.fromJSON(DEFAULT_CONTENT);
        requestAnimationFrame(() => {
          expect(widget.methods).to.contain('onUpdateRequest');
          done();
        });
        widget.activeCellIndex = 1;
      });

    });

    describe('#select()', () => {

      it('should select a cell widget', () => {
        let widget = createActiveWidget();
        widget.model.fromJSON(DEFAULT_CONTENT);
        let cell = widget.childAt(0);
        widget.select(cell);
        expect(widget.isSelected(cell)).to.be(true);
      });

      it('should allow multiple widgets to be selected', () => {
        let widget = createActiveWidget();
        widget.model.fromJSON(DEFAULT_CONTENT);
        for (let i = 0; i < widget.childCount(); i++) {
          let cell = widget.childAt(i);
          widget.select(cell);
          expect(widget.isSelected(cell)).to.be(true);
        }
      });

    });

    describe('#deselect()', () => {

      it('should deselect a cell', () => {
        let widget = createActiveWidget();
        widget.model.fromJSON(DEFAULT_CONTENT);
        for (let i = 0; i < widget.childCount(); i++) {
          if (i === widget.activeCellIndex) {
            continue;
          }
          let cell = widget.childAt(i);
          widget.select(cell);
          expect(widget.isSelected(cell)).to.be(true);
          widget.deselect(cell);
          expect(widget.isSelected(cell)).to.be(false);
        }
      });

      it('should have no effect on the active cell', () => {
        let widget = createActiveWidget();
        widget.model.fromJSON(DEFAULT_CONTENT);
        let cell = widget.childAt(widget.activeCellIndex);
        expect(widget.isSelected(cell)).to.be(true);
        widget.deselect(cell);
        expect(widget.isSelected(cell)).to.be(true);
      });

    });

    describe('#isSelected()', () => {

      it('should get whether the cell is selected', () => {
        let widget = createActiveWidget();
        widget.model.fromJSON(DEFAULT_CONTENT);
        for (let i = 0; i < widget.childCount(); i++) {
          let cell = widget.childAt(i);
          if (i === widget.activeCellIndex) {
            expect(widget.isSelected(cell)).to.be(true);
          } else {
            expect(widget.isSelected(cell)).to.be(false);
          }
        }
      });

    });

    describe('#handleEvent()', () => {

      let widget: LogNotebook;

      beforeEach((done) => {
        widget = createActiveWidget();
        widget.model.fromJSON(DEFAULT_CONTENT);
        widget.attach(document.body);
        requestAnimationFrame(() => { done(); });
      });

      afterEach(() => {
        widget.dispose();
      });

      context('click', () => {

        it('should set the active cell index', () => {
          let child = widget.childAt(1);
          simulate(child.node, 'click');
          expect(widget.events).to.contain('click');
          expect(widget.activeCellIndex).to.be(1);
        });

        it('should be a no-op if the model is read only', () => {
          let child = widget.childAt(1);
          widget.model.readOnly = true;
          simulate(child.node, 'click');
          expect(widget.events).to.contain('click');
          expect(widget.activeCellIndex).to.be(0);
        });

        it('should be a no-op if not not a cell', () => {
          simulate(widget.node, 'click');
          expect(widget.events).to.contain('click');
          expect(widget.activeCellIndex).to.be(0);
        });

      });

      context('dblclick', () => {

        it('should unrender a markdown cell', () => {
          let cell = widget.model.factory.createMarkdownCell();
          widget.model.cells.add(cell);
          let child = widget.childAt(widget.childCount() - 1) as MarkdownCellWidget;
          expect(child.rendered).to.be(true);
          simulate(child.node, 'dblclick');
          expect(child.rendered).to.be(false);
        });

        it('should be a no-op if the model is read only', () => {
          let cell = widget.model.factory.createMarkdownCell();
          widget.model.cells.add(cell);
          widget.model.readOnly = true;
          let child = widget.childAt(widget.childCount() - 1) as MarkdownCellWidget;
          expect(child.rendered).to.be(true);
          simulate(child.node, 'dblclick');
          expect(child.rendered).to.be(true);
        });

      });

      context('focus', () => {

        it('should change to edit mode if a child cell takes focus', () => {
          let child = widget.childAt(0);
          simulate(child.editor.node, 'focus');
          expect(widget.events).to.contain('focus');
          expect(widget.mode).to.be('edit');
        });

        it('should change to command mode if the widget takes focus', () => {
          let child = widget.childAt(0);
          simulate(child.editor.node, 'focus');
          expect(widget.events).to.contain('focus');
          expect(widget.mode).to.be('edit');
          widget.events = [];
          simulate(widget.node, 'focus');
          expect(widget.events).to.contain('focus');
          expect(widget.mode).to.be('command');
        });

      });

    });

    describe('#onAfterAttach()', () => {

      it('should add event listeners', (done) => {
        let widget = createActiveWidget();
        widget.model.fromJSON(DEFAULT_CONTENT);
        widget.attach(document.body);
        let child = widget.childAt(0);
        requestAnimationFrame(() => {
          expect(widget.methods).to.contain('onAfterAttach');
          simulate(widget.node, 'click');
          expect(widget.events).to.contain('click');
          simulate(widget.node, 'dblclick');
          expect(widget.events).to.contain('dblclick');
          simulate(child.node, 'focus');
          expect(widget.events).to.contain('focus');
          widget.dispose();
          done();
        });
      });

      it('should post an update request', (done) => {
        let widget = createActiveWidget();
        widget.model.fromJSON(DEFAULT_CONTENT);
        widget.attach(document.body);
        requestAnimationFrame(() => {
          expect(widget.methods).to.contain('onAfterAttach');
          requestAnimationFrame(() => {
            expect(widget.methods).to.contain('onUpdateRequest');
            widget.dispose();
            done();
          });
        });
      });

    });

    describe('#onBeforeDetach()', () => {

      it('should remove event listeners', (done) => {
        let widget = createActiveWidget();
        widget.model.fromJSON(DEFAULT_CONTENT);
        widget.attach(document.body);
        let child = widget.childAt(0);
        requestAnimationFrame(() => {
          widget.detach();
          expect(widget.methods).to.contain('onBeforeDetach');
          widget.events = [];
          simulate(widget.node, 'click');
          expect(widget.events).to.not.contain('click');
          simulate(widget.node, 'dblclick');
          expect(widget.events).to.not.contain('dblclick');
          simulate(child.node, 'focus');
          expect(widget.events).to.not.contain('focus');
          widget.dispose();
          done();
        });
      });

    });

    describe('#onUpdateRequest()', () => {

      let widget: LogNotebook;

      beforeEach((done) => {
        widget = createActiveWidget();
        widget.model.fromJSON(DEFAULT_CONTENT);
        widget.attach(document.body);
        requestAnimationFrame(() => {  done(); });
      });

      afterEach(() => {
        widget.dispose();
      });

      it('should apply the command class if in command mode', () => {
        expect(widget.methods).to.contain('onUpdateRequest');
        expect(widget.hasClass('jp-mod-commandMode')).to.be(true);
      });

      it('should focus the widget if in command mode', () => {
        expect(widget.node).to.be(document.activeElement);
      });

      it('should apply the edit class if in edit mode', (done) => {
        widget.mode = 'edit';
        requestAnimationFrame(() => {
          expect(widget.hasClass('jp-mod-editMode')).to.be(true);
          done();
        });
      });

      it('should focus the cell if in edit mode', (done) => {
        widget.mode = 'edit';
        let cell = widget.childAt(widget.activeCellIndex);
        requestAnimationFrame(() => {
          expect(cell.node.contains(document.activeElement)).to.be(true);
          done();
        });
      });

      it('should unrender a markdown cell in edit mode', (done) => {
        let cell = widget.model.factory.createMarkdownCell();
        widget.model.cells.add(cell);
        let child = widget.childAt(widget.childCount() - 1) as MarkdownCellWidget;
        expect(child.rendered).to.be(true);
        widget.activeCellIndex = widget.childCount() - 1;
        widget.mode = 'edit';
        requestAnimationFrame(() => {
          expect(child.rendered).to.be(false);
          done();
        });
      });

      it('should add the active class to the active widget', () => {
        let cell = widget.childAt(widget.activeCellIndex);
        expect(cell.hasClass('jp-mod-active')).to.be(true);
      });

      it('should set the selected class on the selected widgets', (done) => {
        widget.select(widget.childAt(1));
        requestAnimationFrame(() => {
          for (let i = 0; i < 2; i++) {
            let cell = widget.childAt(i);
            expect(cell.hasClass('jp-mod-selected')).to.be(true);
            done();
          }
        });
      });

      it('should add the multi select class if there is more than one widget', (done) => {
        widget.select(widget.childAt(1));
        expect(widget.hasClass('jp-mod-multSelected')).to.be(false);
        requestAnimationFrame(() => {
          expect(widget.hasClass('jp-mod-multSelected')).to.be(false);
          done();
        });
      });

    });

    describe('#onChildAdded()', () => {

      it('should post an `update-request', (done) => {
        let widget = createActiveWidget();
        widget.model.fromJSON(DEFAULT_CONTENT);
        expect(widget.methods).to.contain('onChildAdded');
        requestAnimationFrame(() => {
          expect(widget.methods).to.contain('onUpdateRequest');
          done();
        });
      });

      context('`edgeRequested` signal', () => {

        it('should activate the previous cell if top is requested', () => {
          let widget = createActiveWidget();
          widget.model.fromJSON(DEFAULT_CONTENT);
          widget.activeCellIndex = 1;
          let child = widget.childAt(widget.activeCellIndex);
          child.editor.edgeRequested.emit('top');
          expect(widget.activeCellIndex).to.be(0);
        });

        it('should activate the next cell if bottom is requested', ()  => {
          let widget = createActiveWidget();
          widget.model.fromJSON(DEFAULT_CONTENT);
          let child = widget.childAt(widget.activeCellIndex);
          child.editor.edgeRequested.emit('bottom');
          expect(widget.activeCellIndex).to.be(1);
        });

      });

    });

    describe('#onChildRemoved()', () => {

      it('should post an `update-request', (done) => {
        let widget = createActiveWidget();
        let cell = widget.model.cells.get(0);
        widget.model.cells.remove(cell);
        expect(widget.methods).to.contain('onChildRemoved');
        requestAnimationFrame(() => {
          expect(widget.methods).to.contain('onUpdateRequest');
          done();
        });
      });

    });

  });

});
