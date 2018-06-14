<%@ WebHandler Language="C#" Class="AjaxHandler" %>

using System;
using System.Web;
using System.Data.SqlClient;
using System.Data;
using YQDHWebsite.DB;

public class AjaxHandler : IHttpHandler
{
    public void ProcessRequest (HttpContext context) {
        try
        {
            context.Response.ContentType = "text/plain";

            string szAction = context.Request.Params["action"];
            switch (szAction)
            {
                case "addnewtag": AddNewTag(context); break;
                case "updatetag": UpdateTag(context); break;
                case "deletetag": DeleteTag(context); break;
                case "getalltag": GetAllTag(context); break;
            }
        }
        catch (Exception ex)
        {
            context.Response.Write("操作失败: " + ex.Message);
        }
    }

    /// <summary>
    /// 删除地物
    /// </summary>
    /// <param name="context">HttpContext</param>
    private void DeleteTag(HttpContext context) {
        string szTargetID = context.Request.Params["targetid"];
        szTargetID = szTargetID == null ? "" : szTargetID.Trim();
        string szSQL = @"UPDATE [dbo].[T_TargetObject] SET Enabled = 0 WHERE ID=@ID";
        SqlParameter[] sqlParams = new SqlParameter[]
        {
            new SqlParameter("@ID", szTargetID),
        };

        int iRet = SQLServerHelper.ExecuteNonQuery(szSQL, sqlParams);
        if (iRet == 1)
        {
            context.Response.Write("1");
        }
    }

    /// <summary>
    /// 更新地物
    /// </summary>
    /// <param name="context">HttpContext</param>
    private void UpdateTag(HttpContext context) {
        string szName = context.Request.Params["name"];
        szName = szName == null ? "" : szName.Trim();

        string szDesc = context.Request.Params["desc"];
        szDesc = szDesc == null ? "" : szDesc.Trim();

        string szLonlat = context.Request.Params["lonlat"];
        szLonlat = szLonlat == null ? "" : szLonlat.Trim();
        string[] arrLonLat = szLonlat.Split(';');

        string szImgs = context.Request.Params["imgs"];
        szImgs = szImgs == null ? "" : szImgs.Trim();

        string szTargetID = context.Request.Params["targetid"];
        szTargetID = szTargetID == null ? "" : szTargetID.Trim();

        string szSQL = @"UPDATE [dbo].[T_TargetObject] SET [TargetName]=@TargetName, [TargetDesc]=@TargetDesc, 
[Lon]=@Lon,[Lat]=@Lat,[RealImages]=@RealImages WHERE ID=@ID";
        SqlParameter[] sqlParams = new SqlParameter[]
        {
            new SqlParameter("@ID", szTargetID),
            new SqlParameter("@TargetName", szName),
            new SqlParameter("@TargetDesc", szDesc),
            new SqlParameter("@Lon", arrLonLat[0]),
            new SqlParameter("@Lat", arrLonLat[1]),
            new SqlParameter("@RealImages", szImgs)
        };

        int iRet = SQLServerHelper.ExecuteNonQuery(szSQL, sqlParams);
        if (iRet == 1)
        {
            context.Response.Write("1");
        }
    }

    /// <summary>
    /// 添加地物
    /// </summary>
    /// <param name="context">HttpContext</param>
    private void AddNewTag(HttpContext context)
    {
        string szName = context.Request.Params["name"];
        szName = szName == null ? "" : szName.Trim();

        string szDesc = context.Request.Params["desc"];
        szDesc = szDesc == null ? "" : szDesc.Trim();

        string szLonlat = context.Request.Params["lonlat"];
        szLonlat = szLonlat == null ? "" : szLonlat.Trim();
        string[] arrLonLat = szLonlat.Split(';');

        string szImgs = context.Request.Params["imgs"];
        szImgs = szImgs == null ? "" : szImgs.Trim();

        string szSQL = @"INSERT INTO [dbo].[T_TargetObject] ([ID],[TargetName],[TargetDesc], [Lon],[Lat],[RealImages])
VALUES (@ID, @TargetName, @TargetDesc, @Lon, @Lat, @RealImages)";

        string szNewGUID = Guid.NewGuid().ToString();
        SqlParameter[] sqlParams = new SqlParameter[]
        {
            new SqlParameter("@ID", szNewGUID),
            new SqlParameter("@TargetName", szName),
            new SqlParameter("@TargetDesc", szDesc),
            new SqlParameter("@Lon", arrLonLat[0]),
            new SqlParameter("@Lat", arrLonLat[1]),
            new SqlParameter("@RealImages", szImgs)
        };

        int iRet = SQLServerHelper.ExecuteNonQuery(szSQL, sqlParams);
        if (iRet == 1)
        {
            context.Response.Write("newid:" + szNewGUID);
        }
    }
    
    /// <summary>
    /// 获取所有可以显示在地图上的地物
    /// </summary>
    /// <param name="context"></param>
    private void GetAllTag(HttpContext context) {
        DataTable dt = SQLServerHelper.ExecuteDt("SELECT * FROM [dbo].[T_TargetObject] WHERE Enabled=1");
        if (dt != null) {
            context.Response.Write(Tools.DataTableToJson("T_TargetObject", dt));
        }
    }

    public bool IsReusable {
        get {
            return false;
        }
    }

}