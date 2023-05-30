const auth = async (req, res, next) => {
  const Authorization = req.header('Authorization')?.replace('Bearer ', '').trim()
  if (!Authorization) {
    try {
      throw new Error('Error: 无访问权限 | No access rights')
    }
    catch (error) {
      res.send({ status: 'Unauthorized', message: error.message ?? 'Please authenticate.', data: null })
    }
  }
  else {
    next()
  }
}

export { auth }
