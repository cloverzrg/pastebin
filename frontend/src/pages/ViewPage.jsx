import React from 'react'
import { useParams } from 'react-router-dom'

const ViewPage = () => {
  const { id } = useParams()

  // 由于view页面是独立的，我们直接重定向到原有的view页面
  React.useEffect(() => {
    window.location.href = `/${id}`
  }, [id])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">正在跳转...</h2>
        <p className="text-gray-600">请稍候，正在为您加载粘贴内容</p>
      </div>
    </div>
  )
}

export default ViewPage
