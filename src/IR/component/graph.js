import { buildFolderNode, buildFileNode, buildTagNode } from '../block/factory/buildNode'
const linkType = {
  file: 0,
  tag: 1,
  cite: 2
}
export default class IRGraph {
  constructor (files, relations = [], aerials = []) {
    this._initID()
    this.graph = undefined
    // node
    this.treenodes = []
    this.tagnodes = []
    // links
    this.edges = []
    this.relations = []
    this.aerials = []
    // init
    this.idMap = new Map()

    this.addFiles(files)
    this.addRelations(relations)
    this.addAerials(aerials)
  }

  /**
     * private
     * @param {{name: string, path: string, children: [any], type: string}} files
     * @returns
     */
  _parseFileTree (files, depth) {
    let newNode
    if (files.type === 'folder') {
      const nid = this._allocNodeID()
      this.idMap.set(files.path, nid)
      newNode = buildFolderNode(nid, files.name, files.path, depth)
      this.treenodes.push(newNode)
      files.children.forEach(e => {
        newNode.insertAtLast(this._parseFileTree(e, depth + 1))
      })
    } else {
      const nid = this._allocNodeID()
      this.idMap.set(files.path, nid)
      newNode = buildFileNode(nid, files.name, files.path, depth)
      this.treenodes.push(newNode)
    }
    return newNode
  }

  addFiles (files) {
    this.graph = this._parseFileTree(files, 1)
    this._makeEdges()
  }

  /**
   *
   * @param {[{tagName: string, attach: [string]}]} relations
   */
  addRelations (relations) {
    const pathToNodeId = new Map()
    for (const node of this.treenodes) {
      pathToNodeId.set(node.content.path, node.content.id)
    }
    for (const tagInfo of relations) {
      const tagNodeId = this._allocNodeID()
      this.idMap.set(tagInfo.tagName, tagNodeId)
      const tagNode = buildTagNode(tagNodeId, tagInfo.tagName)
      this.tagnodes.push(tagNode)
      tagInfo.attach.forEach(filepath => {
        if (pathToNodeId.has(filepath)) {
          this.relations.push({
            id: this._allocLinkID(),
            source: tagNodeId,
            target: pathToNodeId.get(filepath),
            type: linkType.tag
          })
        }
      })
    }
  }

  /**
   *
   * @param {[{name: string, sourcePath: string, targetPath: string}]} aerials
   */
  addAerials (aerials) {
    const pathToNodeId = new Map()
    for (const node of this.treenodes) {
      pathToNodeId.set(node.content.path, node.content.id)
    }
    for (const aerialInfo of aerials) {
      if (pathToNodeId.has(aerialInfo.sourcePath) && pathToNodeId.has(aerialInfo.targetPath)) {
        this.aerials.push({
          id: this._allocLinkID(),
          source: pathToNodeId.get(aerialInfo.sourcePath),
          target: pathToNodeId.get(aerialInfo.targetPath),
          name: aerialInfo.name,
          type: linkType.cite
        })
      }
    }
  }

  getNodes () {
    const res = []
    for (const node of this.treenodes) {
      res.push(node.toNodeJson())
    }
    for (const node of this.tagnodes) {
      res.push(node.toNodeJson())
    }
    return res
  }

  getIdByName (name) {
    return this.idMap.get(name) || -1
  }

  getLinks () {
    return this.edges.concat(this.relations).concat(this.aerials)
  }

  /** private */
  _makeEdges () {
    for (const node of this.treenodes) {
      node.children.forEach(chnode => {
        this.edges.push({
          id: this._allocLinkID(),
          source: node.content.id,
          target: chnode.content.id,
          type: linkType.file
        })
      })
    }
  }

  /**
   * 获得一个独有的nodeID
   */
  _allocNodeID () {
    return this.nodeid++
  }

  /**
   * 获得一个独有的linkID
   */
  _allocLinkID () {
    return this.linkid++
  }

  _initID () {
    this.nodeid = 0
    this.linkid = 0
  }
}
