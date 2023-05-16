import TreeManager from '@/IR/manager/treeManager'
import bus from 'vue3-eventbus'

const state = {
  treeManager: new TreeManager()
}

const mutations = {
  buildByMarkdownContent (state, fileStats) {
    state.treeManager.build(fileStats.filepath, { content: fileStats.content })
  },
  updateByMarkdown (state, fileStats) {
    if (fileStats.filepath) {
      state.treeManager.update(fileStats.filepath, { content: fileStats.content })
    } else {
      state.treeManager.updateCurrent({ content: fileStats.content })
    }
  },
  updateByMind (state, fileStats) {
    if (fileStats.filepath) {
      state.treeManager.update(fileStats.filepath, { mindJson: fileStats.mindJson })
    } else {
      state.treeManager.updateCurrent({ mindJson: fileStats.mindJson })
    }
  },

  // 设置为当前
  setCurrentFile (state, filepath) {
    state.treeManager.setTreeFromCached(filepath)
  },
  addTag (state, tagname) {
    state.treeManager.addTag(tagname)
  },
  removeTag (state, tagname) {
    state.treeManager.removeTag(tagname)
  },
  undo (state) {
    state.treeManager.undo()
  },
  redo (state) {
    state.treeManager.redo()
  },

  rename (state, pathInfo) {
    state.treeManager.rename(pathInfo.oldPath, pathInfo.newPath)
  }
}

const actions = {
  async setCurrentFile (context, { filepath, type }) {
    if (type === 'setting') {
      bus.emit('changeMode', -1)
    } else {
      if (!context.state.treeManager.containsCached(filepath)) {
        const res = await window.electronAPI.readFile(filepath)
        if (res.error !== -1) {
          context.commit('buildByMarkdownContent', { filepath, content: res.content })
        } else {
          throw new Error(`读取${filepath}失败`)
        }
      }
      context.commit('setCurrentFile', filepath)
    }
  }
}

const getters = {
  markdown: (state) => state.treeManager.markdown,
  mind: (state) => state.treeManager.mind,
  outline: (state) => state.treeManager.outline,
  tags: (state) => state.treeManager.tags
}

const filesManager = {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}

export default filesManager