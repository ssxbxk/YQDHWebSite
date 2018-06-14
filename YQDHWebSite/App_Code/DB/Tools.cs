using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Runtime.Serialization;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Xml;
using System.Collections;
using System.IO.Compression;
using System.Data.SqlClient;

namespace YQDHWebsite.DB
{
    public class Tools
    {
        /// <summary>
        /// datatable转XML
        /// </summary>
        /// <param name="xmlDS"></param>
        /// <returns></returns>
        public static string ConvertDataTableToXML(DataTable xmlDS)
        {
            MemoryStream stream = null;
            XmlTextWriter writer = null;
            try
            {
                if (xmlDS.Rows.Count == 0)
                    return String.Empty;

                stream = new MemoryStream();
                writer = new XmlTextWriter(stream, new UTF8Encoding(false));
                xmlDS.WriteXml(writer);
                int count = (int)stream.Length;
                byte[] arr = new byte[count];
                stream.Seek(0, SeekOrigin.Begin);
                stream.Read(arr, 0, count);
                UTF8Encoding utf = new UTF8Encoding();
                return utf.GetString(arr).Trim();
            }
            catch
            {
                return String.Empty;
            }
            finally
            {
                if (writer != null)
                    writer.Close();
            }
        }

        /// <summary>
        /// Msdn 将DataTable转换为JSON格式
        /// </summary>
        /// <param name="jsonName"></param>
        /// <param name="dt"></param>
        /// <returns></returns>
        public static string DataTableToJson(string jsonName, DataTable dt)
        {
            StringBuilder Json = new StringBuilder();
            Json.Append("{\"" + jsonName + "\":[");
            if (dt.Rows.Count > 0)
            {
                for (int i = 0; i < dt.Rows.Count; i++)
                {
                    Json.Append("{");
                    for (int j = 0; j < dt.Columns.Count; j++)
                    {
                        Json.Append("\"" + dt.Columns[j].ColumnName.ToString() + "\":\""
                            + ReplaceLowOrderASCIICharacters(dt.Rows[i][j].ToString()).Replace("'", "").Replace("\"", "").Replace("\\", "").Replace("\r", "").Replace("\n", "") + "\"");
                        if (j < dt.Columns.Count - 1)
                        {
                            Json.Append(",");
                        }
                    }
                    Json.Append("}");
                    if (i < dt.Rows.Count - 1)
                    {
                        Json.Append(",");
                    }
                }
            }
            Json.Append("]}");
            return Json.ToString();
        }

        /// <summary>
        /// 过滤非打印字符
        /// </summary>
        /// <param name="tmp">待过滤</param>
        /// <returns>过滤好的</returns>
        public static string ReplaceLowOrderASCIICharacters(string tmp)
        {
            tmp = tmp.Replace("&#", "");
            StringBuilder info = new StringBuilder();
            foreach (char cc in tmp)
            {
                int checki = Convert.ToInt32(cc);
                if (checki != 15)
                {
                    int ss = (int)cc;
                    if (((ss >= 0) && (ss <= 8)) || ((ss >= 11) && (ss <= 12)) || ((ss >= 14) && (ss <= 31)))
                    {
                        info.AppendFormat("", ss);
                    }
                    else
                    {
                        info.Append(cc);
                    }
                }
                else
                {
                    char one = cc;
                }
            }
            return info.ToString();
        }

        #region 生成语句
        public static string InsertByHashtable(string tableName, Hashtable ht)
        {
            StringBuilder sb = new StringBuilder();
            try
            {
                sb.Append(" Insert Into ");
                sb.Append(tableName);
                sb.Append("(");
                StringBuilder sp = new StringBuilder();
                StringBuilder sb_prame = new StringBuilder();
                foreach (string key in ht.Keys)
                {
                    sb_prame.Append("," + key);
                    sp.Append(",'" + ht[key] + "'");
                }
                sb.Append(sb_prame.ToString().Substring(1, sb_prame.ToString().Length - 1) + ") Values (");
                sb.Append(sp.ToString().Substring(1, sp.ToString().Length - 1) + ")");
            }
            catch (Exception ex)
            {
                string aa = ex.Message;
            }
            return sb.ToString();
        }
        public static string UpdateByHashtable(string tableName, string pkName, string pkVal, Hashtable ht)
        {
            StringBuilder sb = new StringBuilder();
            try
            {
                sb.Append(" Update ");
                sb.Append(tableName);
                sb.Append(" Set ");
                bool isFirstValue = true;
                foreach (string key in ht.Keys)
                {
                    if (isFirstValue)
                    {
                        isFirstValue = false;
                        sb.Append(key);
                        sb.Append("=");
                        sb.Append("'" + ht[key] + "'");
                    }
                    else
                    {
                        sb.Append("," + key);
                        sb.Append("=");
                        sb.Append("'" + ht[key] + "'");
                    }
                }
                sb.Append(" Where ").Append(pkName).Append("=").Append("'" + pkVal + "'");

            }
            catch (Exception ex)
            {
                string aa = ex.Message;
            }
            return sb.ToString();
        }
        #endregion

        #region 数据分页
        /// <summary>
        /// 摘要:
        ///     数据分页接口
        /// 参数：
        ///     sql：传入要执行sql语句
        ///     param：参数化
        ///     orderField：排序字段
        ///     orderType：排序类型
        ///     pageIndex：当前页
        ///     pageSize：页大小
        ///     count：返回查询条数
        /// </summary>
        public static DataTable GetPageList(string sql, SqlParameter[] param, string orderField, string orderType, int pageIndex, int pageSize, ref int count)
        {
            StringBuilder sb = new StringBuilder();
            try
            {
                int num = (pageIndex - 1) * pageSize;
                int num1 = (pageIndex) * pageSize;
                sb.Append("Select * From (Select ROW_NUMBER() Over (Order By " + orderField + " " + orderType + "");
                sb.Append(") As rowNum, * From (" + sql + ") As T ) As N Where rowNum > " + num + " And rowNum <= " + num1 + "");
                count = SQLServerHelper.ExecuteDt("Select Count(1) From (" + sql + ") As t", param).Rows.Count;
                return SQLServerHelper.ExecuteDt(sb.ToString(), param);
            }
            catch (Exception e)
            {
                ////Logger.WriteLog("-----------数据分页（Oracle）-----------\r\n" + sb.ToString(), e);
                return null; ;
            }
        }
        #endregion
    }
}