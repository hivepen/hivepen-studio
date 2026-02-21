import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, NodeSelection, TextSelection } from '@tiptap/pm/state'
import { Slice, Fragment } from '@tiptap/pm/model'
import * as pmView from '@tiptap/pm/view'

const getPmView = () => {
  try {
    return pmView
  } catch {
    return null
  }
}

const serializeForClipboard = (view: any, slice: Slice) => {
  if (view && typeof view.serializeForClipboard === 'function') {
    return view.serializeForClipboard(slice)
  }
  const proseMirrorView = getPmView()
  if (proseMirrorView && typeof (proseMirrorView as any)?.__serializeForClipboard === 'function') {
    return (proseMirrorView as any).__serializeForClipboard(view, slice)
  }
  throw new Error('No supported clipboard serialization method found.')
}

const absoluteRect = (node: Element) => {
  const data = node.getBoundingClientRect()
  const modal = node.closest('[role="dialog"]')
  if (modal && window.getComputedStyle(modal).transform !== 'none') {
    const modalRect = modal.getBoundingClientRect()
    return {
      top: data.top - modalRect.top,
      left: data.left - modalRect.left,
      width: data.width,
    }
  }
  return {
    top: data.top,
    left: data.left,
    width: data.width,
  }
}

const nodeDOMAtCoords = (
  coords: { x: number; y: number },
  options: { customNodes: string[] }
) => {
  const selectors = [
    'li',
    'p:not(:first-child)',
    'pre',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    ...options.customNodes.map((node) => `[data-type=${node}]`),
  ].join(', ')
  return document
    .elementsFromPoint(coords.x, coords.y)
    .find(
      (elem) =>
        elem.parentElement?.matches?.('.ProseMirror') || elem.matches(selectors)
    )
}

const nodePosAtDOM = (
  node: Element,
  view: pmView.EditorView,
  options: { dragHandleWidth: number }
) => {
  const boundingRect = node.getBoundingClientRect()
  return view.posAtCoords({
    left: boundingRect.left + 50 + options.dragHandleWidth,
    top: boundingRect.top + 1,
  })?.inside
}

const calcNodePos = (pos: number, view: pmView.EditorView) => {
  const $pos = view.state.doc.resolve(pos)
  if ($pos.depth > 1) return $pos.before($pos.depth)
  return pos
}

const DragHandlePlugin = (options: {
  pluginKey: string
  dragHandleWidth: number
  scrollTreshold: number
  dragHandleSelector?: string
  excludedTags: string[]
  customNodes: string[]
}) => {
  let listType = ''

  const handleDragStart = (event: DragEvent, view: pmView.EditorView) => {
    view.focus()
    if (!event.dataTransfer) return
    const node = nodeDOMAtCoords(
      {
        x: event.clientX + 50 + options.dragHandleWidth,
        y: event.clientY,
      },
      options
    )
    if (!(node instanceof Element)) return
    let draggedNodePos = nodePosAtDOM(node, view, options)
    if (draggedNodePos == null || draggedNodePos < 0) return
    draggedNodePos = calcNodePos(draggedNodePos, view)
    const { from, to } = view.state.selection
    const diff = from - to
    const fromSelectionPos = calcNodePos(from, view)
    let differentNodeSelected = false
    const nodePos = view.state.doc.resolve(fromSelectionPos)
    if (nodePos.node().type.name === 'doc') {
      differentNodeSelected = true
    } else {
      const nodeSelection = NodeSelection.create(view.state.doc, nodePos.before())
      differentNodeSelected = !(
        draggedNodePos + 1 >= nodeSelection.$from.pos &&
        draggedNodePos <= nodeSelection.$to.pos
      )
    }

    let selection = view.state.selection
    if (
      !differentNodeSelected &&
      diff !== 0 &&
      !(view.state.selection instanceof NodeSelection)
    ) {
      const endSelection = NodeSelection.create(view.state.doc, to - 1)
      selection = TextSelection.create(view.state.doc, draggedNodePos, endSelection.$to.pos)
    } else {
      selection = NodeSelection.create(view.state.doc, draggedNodePos)
      if (selection.node.type.isInline || selection.node.type.name === 'tableRow') {
        const $pos = view.state.doc.resolve(selection.from)
        selection = NodeSelection.create(view.state.doc, $pos.before())
      }
    }

    // Ensure blockquote stays intact when dragging its paragraph
    if (selection instanceof NodeSelection && selection.node.type.name === 'paragraph') {
      const $pos = view.state.doc.resolve(selection.from)
      if ($pos.parent.type.name === 'blockquote') {
        selection = NodeSelection.create(view.state.doc, $pos.before())
      }
    }

    view.dispatch(view.state.tr.setSelection(selection))

    if (
      view.state.selection instanceof NodeSelection &&
      view.state.selection.node.type.name === 'listItem'
    ) {
      listType = node.parentElement?.tagName ?? ''
    }

    const slice = view.state.selection.content()
    const { dom, text } = serializeForClipboard(view, slice)
    event.dataTransfer.clearData()
    event.dataTransfer.setData('text/html', dom.innerHTML)
    event.dataTransfer.setData('text/plain', text)
    event.dataTransfer.effectAllowed = 'copyMove'
    event.dataTransfer.setDragImage(node, 0, 0)
    view.dragging = { slice, move: event.ctrlKey }
  }

  let dragHandleElement: HTMLDivElement | null = null

  const hideDragHandle = () => {
    dragHandleElement?.classList.add('hide')
  }

  const showDragHandle = () => {
    dragHandleElement?.classList.remove('hide')
  }

  const hideHandleOnEditorOut = (event: MouseEvent) => {
    if (event.target instanceof Element) {
      const relatedTarget = event.relatedTarget as Element | null
      const isInsideEditor =
        relatedTarget?.classList.contains('tiptap') ||
        relatedTarget?.classList.contains('drag-handle') ||
        Boolean(relatedTarget && dragHandleElement?.contains(relatedTarget))
      if (isInsideEditor) return
    }
    hideDragHandle()
  }

  return new Plugin({
    key: new PluginKey(options.pluginKey),
    view: (view) => {
      const handleBySelector = options.dragHandleSelector
        ? document.querySelector(options.dragHandleSelector)
        : null
      dragHandleElement = (handleBySelector as HTMLDivElement) ?? document.createElement('div')
      dragHandleElement.draggable = true
      dragHandleElement.dataset.dragHandle = ''
      dragHandleElement.classList.add('drag-handle')

      const onDragHandleDragStart = (event: DragEvent) => handleDragStart(event, view)
      const onDragHandleDrag = (event: DragEvent) => {
        hideDragHandle()
        if (!event) return
        const scrollY = window.scrollY
        if (event.clientY < options.scrollTreshold) {
          window.scrollTo({ top: scrollY - 30, behavior: 'smooth' })
        } else if (window.innerHeight - event.clientY < options.scrollTreshold) {
          window.scrollTo({ top: scrollY + 30, behavior: 'smooth' })
        }
      }

      dragHandleElement.addEventListener('dragstart', onDragHandleDragStart)
      dragHandleElement.addEventListener('drag', onDragHandleDrag)
      dragHandleElement.addEventListener('mouseenter', showDragHandle)
      dragHandleElement.addEventListener('mouseleave', hideDragHandle)
      hideDragHandle()
      if (!handleBySelector) {
        view?.dom?.parentElement?.appendChild(dragHandleElement)
      }
      view?.dom?.parentElement?.addEventListener('mouseout', hideHandleOnEditorOut)

      return {
        destroy: () => {
          if (!handleBySelector) {
            dragHandleElement?.remove?.()
          }
          dragHandleElement?.removeEventListener('drag', onDragHandleDrag)
          dragHandleElement?.removeEventListener('dragstart', onDragHandleDragStart)
          dragHandleElement?.removeEventListener('mouseenter', showDragHandle)
          dragHandleElement?.removeEventListener('mouseleave', hideDragHandle)
          dragHandleElement = null
          view?.dom?.parentElement?.removeEventListener('mouseout', hideHandleOnEditorOut)
        },
      }
    },
    props: {
      handleDOMEvents: {
        mousemove: (view, event) => {
          if (!view.editable) return
          if (event.target instanceof Element && event.target.closest('.drag-handle')) {
            showDragHandle()
            return
          }
          const handlesContainer = view.dom.closest('[data-show-handles]') as HTMLElement | null
          if (handlesContainer?.dataset.showHandles === 'false') {
            hideDragHandle()
            return
          }
          const node = nodeDOMAtCoords(
            {
              x: event.clientX + 50 + options.dragHandleWidth,
              y: event.clientY,
            },
            options
          )
          const notDragging = node?.closest('.not-draggable')
          const excludedTagList = options.excludedTags.concat(['ol', 'ul']).join(', ')
          if (!(node instanceof Element) || node.matches(excludedTagList) || notDragging) {
            hideDragHandle()
            return
          }
          const compStyle = window.getComputedStyle(node)
          const parsedLineHeight = parseInt(compStyle.lineHeight, 10)
          const lineHeight = Number.isNaN(parsedLineHeight)
            ? parseInt(compStyle.fontSize, 10) * 1.2
            : parsedLineHeight
          const paddingTop = parseInt(compStyle.paddingTop, 10)
          const rect = absoluteRect(node)
          rect.top += (lineHeight - 24) / 2
          rect.top += paddingTop
          if (node.matches('ul:not([data-type=taskList]) li, ol li')) {
            rect.left -= options.dragHandleWidth
          }
          rect.width = options.dragHandleWidth
          if (!dragHandleElement) return
          dragHandleElement.style.left = `${rect.left - rect.width}px`
          dragHandleElement.style.top = `${rect.top}px`
          showDragHandle()
        },
        keydown: () => {
          hideDragHandle()
        },
        mousewheel: () => {
          hideDragHandle()
        },
        dragstart: (view) => {
          view.dom.classList.add('dragging')
        },
        drop: (view, event) => {
          view.dom.classList.remove('dragging')
          hideDragHandle()
          let droppedNode = null
          const dropPos = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          })
          if (!dropPos) return
          if (view.state.selection instanceof NodeSelection) {
            droppedNode = view.state.selection.node
          }
          if (!droppedNode) return
          const resolvedPos = view.state.doc.resolve(dropPos.pos)
          const isDroppedInsideList = resolvedPos.parent.type.name === 'listItem'
          if (
            view.state.selection instanceof NodeSelection &&
            view.state.selection.node.type.name === 'listItem' &&
            !isDroppedInsideList &&
            listType === 'OL'
          ) {
            const newList =
              view.state.schema.nodes.orderedList?.createAndFill(null, droppedNode)
            if (!newList) return
            const slice = new Slice(Fragment.from(newList), 0, 0)
            view.dragging = { slice, move: event.ctrlKey }
          }
        },
        dragend: (view) => {
          view.dom.classList.remove('dragging')
        },
      },
    },
  })
}

const GlobalDragHandle = Extension.create({
  name: 'globalDragHandle',
  addOptions() {
    return {
      dragHandleWidth: 20,
      scrollTreshold: 100,
      excludedTags: [],
      customNodes: [],
    }
  },
  addProseMirrorPlugins() {
    return [
      DragHandlePlugin({
        pluginKey: 'globalDragHandle',
        dragHandleWidth: this.options.dragHandleWidth,
        scrollTreshold: this.options.scrollTreshold,
        dragHandleSelector: this.options.dragHandleSelector,
        excludedTags: this.options.excludedTags,
        customNodes: this.options.customNodes,
      }),
    ]
  },
})

export default GlobalDragHandle
