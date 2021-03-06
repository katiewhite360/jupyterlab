// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IKernel, IExecuteReply
} from 'jupyter-js-services';

import {
  IDisposable
} from 'phosphor-disposable';

import {
  IListChangedArgs, IObservableList, ObservableList
} from 'phosphor-observablelist';

import {
  ISignal, Signal, clearSignalData
} from 'phosphor-signaling';

import {
  nbformat
} from '../notebook/nbformat';


/**
 * An model that maintains a list of output data.
 */
export
class OutputAreaModel implements IDisposable {
  /**
   * Construct a new observable outputs instance.
   */
  constructor() {
    this._list = new ObservableList<nbformat.IOutput>();
    this._list.changed.connect(this._onListChanged, this);
  }

  /**
   * A signal emitted when the model changes.
   */
  get changed(): ISignal<OutputAreaModel, IListChangedArgs<nbformat.IOutput>> {
    return Private.changedSignal.bind(this);
  }

  /**
   * Get the length of the items in the model.
   *
   * #### Notes
   * This is a read-only property.
   */
  get length(): number {
    return this._list ? this._list.length : 0;
  }

  /**
   * Test whether the model is disposed.
   *
   * #### Notes
   * This is a read-only property.
   */
  get isDisposed(): boolean {
    return this._list === null;
  }

  /**
   * Dispose of the resources used by the model.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._list.clear();
    this._list = null;
    clearSignalData(this);
  }

  /**
   * Get an item at the specified index.
   */
  get(index: number): nbformat.IOutput {
    return this._list.get(index);
  }

  /**
   * Add an output, which may be combined with previous output.
   *
   * #### Notes
   * The output bundle is copied.
   * Contiguous stream outputs of the same `name` are combined.
   */
  add(output: nbformat.IOutput): number {
    // If we received a delayed clear message, then clear now.
    if (this._clearNext) {
      this.clear();
      this._clearNext = false;
    }

    // Make a copy of the output bundle.
    output = JSON.parse(JSON.stringify(output));

    // Join multiline text outputs.
    if (nbformat.isStream(output)) {
      if (Array.isArray(output.text)) {
        output.text = (output.text as string[]).join('\n');
      }
    }

    // Consolidate outputs if they are stream outputs of the same kind.
    let index = this.length - 1;
    let lastOutput = this.get(index) as nbformat.IStream;
    if (nbformat.isStream(output)
        && lastOutput && nbformat.isStream(lastOutput)
        && output.name === lastOutput.name) {
      // In order to get a list change event, we add the previous
      // text to the current item and replace the previous item.
      // This also replaces the metadata of the last item.
      let text = output.text as string;
      output.text = lastOutput.text as string + text;
      this._list.set(index, output);
      return index;
    } else {
      switch (output.output_type) {
      case 'stream':
      case 'execute_result':
      case 'display_data':
      case 'error':
        return this._list.add(output);
      default:
        break;
      }
    }
    return -1;
  }

  /**
   * Clear all of the output.
   *
   * @param wait Delay clearing the output until the next message is added.
   */
  clear(wait: boolean = false): nbformat.IOutput[] {
    if (wait) {
      this._clearNext = true;
      return [];
    }
    return this._list.clear();
  }

  /**
   * Handle a change to the list.
   */
  private _onListChanged(sender: IObservableList<nbformat.IOutput>, args: IListChangedArgs<nbformat.IOutput>) {
    this.changed.emit(args);
  }

  private _clearNext = false;
  private _list: IObservableList<nbformat.IOutput> = null;
}


/**
 * Execute code on a kernel and send outputs to an output area model.
 */
export
function executeCode(code: string, kernel: IKernel, outputs: OutputAreaModel): Promise<IExecuteReply> {
  let exRequest = {
    code,
    silent: false,
    store_history: true,
    stop_on_error: true,
    allow_stdin: true
  };
  outputs.clear();
  return new Promise<IExecuteReply>((resolve, reject) => {
    let future = kernel.execute(exRequest);
    future.onIOPub = (msg => {
      let model = msg.content;
      if (model !== void 0) {
        model.output_type = msg.header.msg_type as nbformat.OutputType;
        outputs.add(model);
      }
    });
    future.onReply = (msg => {
      resolve(msg.content as IExecuteReply);
    });
  });
}


/**
 * A namespace for private data.
 */
namespace Private {
  /**
   * A signal emitted when the model changes.
   */
  export
  const changedSignal = new Signal<OutputAreaModel, IListChangedArgs<nbformat.IOutput>>();
}
