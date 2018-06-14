<%@ WebHandler Language="C#" Class="FileHandler" %>

using System;
using System.IO;
using System.Web;
using System.Data.SqlClient;
using System.Data;
using YQDHWebsite.DB;

public class FileHandler : IHttpHandler {

    public void ProcessRequest (HttpContext context)
    {
        string json = "{\"msg\":\"failed\"}";
        try
        {
            context.Response.ContentType = "text/plain";

            string szAction = context.Request.Params["action"];
            switch (szAction) {
                case "deleteimg" : json = DeleteImage(context); break;
                default : json = ReceiveFile(context);break;
            }
        }
        catch (Exception ex)
        {
            //失败时返回的参数必须加 error键
            json = "{\"msg\":\"" + ex.Message + "\"}";
        }
        context.Response.Write(json);
        context.Response.End();
    }

    /// <summary>
    /// 删除指定的图片文件
    /// </summary>
    /// <param name="context">HttpContext</param>
    /// <returns>{"msg":"success"}</returns>
    public string DeleteImage(HttpContext context) {
        string szJSON = "{\"msg\":\"failed\"}";
        string szObjectID = context.Request.Params["key"];
        szObjectID = szObjectID == null ? "" : szObjectID.Trim();

        string szImgName = context.Request.Params["name"];
        szImgName = szImgName == null ? "" : szImgName.Trim();

        string szSQL = "SELECT RealImages FROM [dbo].[T_TargetObject] WHERE ID=@ID";
        SqlParameter[] sqlParams = new SqlParameter[]
        {
            new SqlParameter("@ID", szObjectID)
        };

        DataTable dt = SQLServerHelper.ExecuteDtTxt(szSQL, sqlParams);
        if (dt != null) {
            string szRealImages = dt.Rows[0]["RealImages"].ToString() + ";";
            szRealImages = szRealImages.Replace(szImgName + ";", "").TrimEnd(';');
            szSQL = "UPDATE [dbo].[T_TargetObject] SET RealImages=@RealImages WHERE ID=@ID";
            sqlParams = new SqlParameter[]
            {
                new SqlParameter("@ID", szObjectID),
                new SqlParameter("@RealImages", szRealImages)
            };

            int iRet = SQLServerHelper.ExecuteNonQuery(szSQL, sqlParams);
            if (iRet == 1) {
                szJSON = "{\"msg\":\"success\"}";

                string savepath = context.Server.MapPath("..\\uploadimages") + "\\" + szImgName;
                if (File.Exists(savepath))
                    File.Delete(savepath);
            }
        }

        return szJSON;
    }

    /// <summary>
    /// 接收客户端POST上来的图片文件
    /// </summary>
    /// <param name="context">HttpContext</param>
    /// <returns>{"msg":"success","filename":"xxx"}</returns>
    public string ReceiveFile(HttpContext context) {
        HttpPostedFile file = context.Request.Files[0];
        string fileName = file.FileName;
        string filePostfix = fileName.Substring(fileName.Length - 4);
        fileName = GetFileName(filePostfix);
        string savepath = context.Server.MapPath("..\\uploadimages") + "\\" + fileName;
        file.SaveAs(savepath);
        return "{\"msg\":\"success\", \"filename\":\"" + fileName + "\"}";
    }

    private string GetFileName(string szPostfix) {
        return Guid.NewGuid().ToString() + szPostfix;
    }

    public bool IsReusable {
        get {
            return false;
        }
    }

}