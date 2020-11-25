const jwt = require('jsonwebtoken')

module.exports = function(req,res,next){
    const token = req.header('auth-token')
    if (!token) return res.status(401).send('Access Denied!')

    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET)
        if(verified.isadmin === true) next()
        else if(Number(verified.user_id) === Number( req.params.id)) next() 
        else res.status(400).send('No Access!')    
    } catch (error) {
        res.status(400).send('Invalid Token!')        
    }
}