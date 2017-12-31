
if(process.env.NODE_ENV === 'production'){
    module.exports = {
        database: 'mongodb://manjulsigdel:manjul111@ds135817.mlab.com:35817/knowledgebase',
        secret: 'yoursecret'
    }
} else {
    module.exports = {
        database: 'mongodb://localhost:27017/nodekb',
        secret: 'yoursecret'
    }    
}

