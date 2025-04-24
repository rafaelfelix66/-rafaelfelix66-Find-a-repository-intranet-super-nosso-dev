// controllers/filesController.js
const { File, Folder } = require('../models');
const path = require('path');
const fs = require('fs');

const getFiles = async (req, res) => {
  try {
    const { folderId } = req.query;
    let fileQuery = {};
    let folderQuery = {};
    if (folderId) {
      fileQuery = { folderId };
      folderQuery = { parentId: folderId };
    } else {
      fileQuery = { folderId: null };
      folderQuery = { parentId: null };
    }
    fileQuery.$or = [
      { owner: req.usuario.id },
      { 'sharedWith.user': req.usuario.id },
      { isPublic: true }
    ];
    folderQuery.$or = [
      { owner: req.usuario.id },
      { 'sharedWith.user': req.usuario.id },
      { isPublic: true }
    ];
    const files = await File.find(fileQuery)
      .populate('owner', ['nome'])
      .sort({ createdAt: -1 });
    const folders = await Folder.find(folderQuery)
      .populate('owner', ['nome'])
      .sort({ name: 1 });
    res.json({ folders, files });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
};

const createFolder = async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const existingFolder = await Folder.findOne({
      name,
      parentId: parentId || null,
      owner: req.usuario.id
    });
    if (existingFolder) {
      return res.status(400).json({ msg: 'Já existe uma pasta com este nome neste local' });
    }
    const newFolder = new Folder({
      name,
      parentId: parentId || null,
      owner: req.usuario.id
    });
    const folder = await newFolder.save();
    res.json(folder);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
};

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'Nenhum arquivo enviado' });
    }
    const { folderId } = req.body;
    const file = req.file;
    const fileExt = path.extname(file.originalname).substring(1);
    const newFile = new File({
      name: path.basename(file.originalname, path.extname(file.originalname)),
      path: file.path,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      extension: fileExt,
      folderId: folderId || null,
      owner: req.usuario.id
    });
    const savedFile = await newFile.save();
    const populatedFile = await File.findById(savedFile._id)
      .populate('owner', ['nome']);
    res.json(populatedFile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
};

const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ msg: 'Arquivo não encontrado' });
    }
    const hasAccess = 
      file.owner.toString() === req.usuario.id || 
      file.isPublic || 
      file.sharedWith.some(share => share.user.toString() === req.usuario.id);
    if (!hasAccess) {
      return res.status(401).json({ msg: 'Acesso negado' });
    }
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ msg: 'Arquivo físico não encontrado' });
    }
    res.download(file.path, file.originalName);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Arquivo não encontrado' });
    }
    res.status(500).send('Erro no servidor');
  }
};

const shareItem = async (req, res) => {
  try {
    const { itemId, itemType, userId, access } = req.body;
    let item;
    if (itemType === 'file') {
      item = await File.findById(itemId);
    } else if (itemType === 'folder') {
      item = await Folder.findById(itemId);
    } else {
      return res.status(400).json({ msg: 'Tipo de item inválido' });
    }
    if (!item) {
      return res.status(404).json({ msg: 'Item não encontrado' });
    }
    if (item.owner.toString() !== req.usuario.id) {
      return res.status(401).json({ msg: 'Apenas o proprietário pode compartilhar' });
    }
    const shareIndex = item.sharedWith.findIndex(
      share => share.user.toString() === userId
    );
    if (shareIndex !== -1) {
      item.sharedWith[shareIndex].access = access;
    } else {
      item.sharedWith.push({ user: userId, access });
    }
    await item.save();
    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
};

const deleteItem = async (req, res) => {
  try {
    const { itemId, itemType } = req.params;
    let item;
    if (itemType === 'file') {
      item = await File.findById(itemId);
      if (!item) {
        return res.status(404).json({ msg: 'Arquivo não encontrado' });
      }
      if (item.owner.toString() !== req.usuario.id) {
        return res.status(401).json({ msg: 'Não autorizado' });
      }
      if (fs.existsSync(item.path)) {
        fs.unlinkSync(item.path);
      }
      await item.deleteOne();
    } else if (itemType === 'folder') {
      item = await Folder.findById(itemId);
      if (!item) {
        return res.status(404).json({ msg: 'Pasta não encontrada' });
      }
      if (item.owner.toString() !== req.usuario.id) {
        return res.status(401).json({ msg: 'Não autorizado' });
      }
      const deleteFolder = async (folderId) => {
        const files = await File.find({ folderId });
        for (const file of files) {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          await file.deleteOne();
        }
        const subFolders = await Folder.find({ parentId: folderId });
        for (const subFolder of subFolders) {
          await deleteFolder(subFolder._id);
        }
        await Folder.findByIdAndDelete(folderId);
      };
      await deleteFolder(itemId);
    } else {
      return res.status(400).json({ msg: 'Tipo de item inválido' });
    }
    res.json({ msg: 'Item excluído com sucesso' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Item não encontrado' });
    }
    res.status(500).send('Erro no servidor');
  }
};

const getFileInfo = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ msg: 'Arquivo não encontrado' });
    }
    const hasAccess = 
      file.owner.toString() === req.usuario.id || 
      file.isPublic || 
      file.sharedWith.some(share => share.user.toString() === req.usuario.id);
    if (!hasAccess) {
      return res.status(401).json({ msg: 'Acesso negado' });
    }
    
    // Retorna apenas as informações necessárias
    res.json({
      _id: file._id,
      name: file.name,
      originalName: file.originalName,
      extension: file.extension,
      mimeType: file.mimeType
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Arquivo não encontrado' });
    }
    res.status(500).send('Erro no servidor');
  }
};

// Não esqueça de exportar
module.exports = { 
  getFiles, 
  createFolder, 
  uploadFile, 
  downloadFile, 
  shareItem, 
  deleteItem,
  getFileInfo // Adicione esta linha
};