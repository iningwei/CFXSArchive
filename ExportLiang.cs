using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;

//靓号规则
//前10000的，比如1382；前100000的，有连续4个数字就满足，比如25555、33331；有5位或更多连续相同数字，比如3555552；连续5个或更多数字按等差数列排列的，比如20345671和1357943；有AABBCC、AAABBB、AAAABB、AABBBB、ABABAB、ABCABC、ABCDABCD类型的，比如33881132、353535、236236、14831483；以888、666、520、521开头或者结尾的;回文数，比如3421243

public class ExportLiang : Editor
{
    [MenuItem("Assets/ExportLiang")]
    static void DoExportLiang()
    {
        UnityEngine.Object[] assets = Selection.GetFiltered(typeof(UnityEngine.Object), SelectionMode.DeepAssets) as UnityEngine.Object[];
        for (int i = 0; i < assets.Length; i++)
        {
            var path = AssetDatabase.GetAssetOrScenePath(assets[i]);
            Debug.LogError("path:" + path);
            outputLiangResult(Application.dataPath + path.Substring(6));
        }
    }

    static void outputLiangResult(string path)
    {
        string[] lines = File.ReadAllLines(path);
        List<int> allDatas = new List<int>();
        for (int i = 0; i < lines.Length; i++)
        {
            //Id 2250871 already exchanged
            if (lines[i].Trim().EndsWith("already exchanged"))
            {
                int data = int.Parse(lines[i].Split(' ')[1]);
                allDatas.Add(data);
            }

            //Transfer cfxs id 2250534,2250543,2250871,2252202,2252204,2252334,2252340,2252341 to 0x2XXXXXXXXXXXXXXX
            if (lines[i].Trim().StartsWith("Transfer cfxs id "))
            {
                int indexOfTo = lines[i].Trim().IndexOf("to");
                var line = lines[i].Trim().Substring(16, indexOfTo - 16);
                //Debug.Log(line);
                var numStrs = line.Trim().Split(',');
                for (int j = 0; j < numStrs.Length; j++)
                {
                    allDatas.Add(int.Parse(numStrs[j]));
                }
            }

            //Exchange cfxs id 4600315,4603290,4604167,4604332,4605453
            if (lines[i].Trim().StartsWith("Exchange cfxs id"))
            {
                string[] numStrs = lines[i].Trim().Split(' ')[3].Split(',');
                for (int j = 0; j < numStrs.Length; j++)
                {
                    allDatas.Add(int.Parse(numStrs[j]));
                }
            }
        }
        Debug.Log("total data:" + allDatas.Count);
        List<int> liangDatas = new List<int>();
        for (int i = 0; i < allDatas.Count; i++)
        {
            if (isLiang(allDatas[i]))
            {
                //Debug.Log(allDatas[i] + " is liang");
                liangDatas.Add(allDatas[i]);
            }
        }
        string liangStr = "";
        for (int j = 0; j < liangDatas.Count; j++)
        {
            liangStr = liangStr + liangDatas[j] + " , ";
        }
        Debug.LogError(path + " liang, count: " + liangDatas.Count + " -----> " + liangStr);
    }

    static bool isLiang(int num)
    {
        if (IsTopTenThousand(num))
        {
            return true;
        }
        if (HasContinuousFourDigits(num))
        {
            return true;
        }
        if (IsSameDigits(num))
        {
            return true;
        }
        if (IsPalindrome(num))
        {
            return true;
        }
        if (IsArithmeticSequence(num))
        {
            return true;
        }
        if (IsSpecialType(num))
        {
            return true;
        }

        return false;
    }



    // 判断是否为前10000的靓号
    static bool IsTopTenThousand(int number)
    {
        return number <= 10000;
    }
    // 判断是否为前100000的靓号（有连续4个数字）
    static bool HasContinuousFourDigits(int number)
    {
        if (number > 100000)
        {
            return false;
        }
        string numString = number.ToString();
        for (int i = 0; i < numString.Length - 3; i++)
        {
            int count = 1;
            for (int j = i + 1; j < numString.Length; j++)
            {
                if (numString[j] - numString[j - 1] == 1)
                {
                    count++;
                    if (count == 4)
                        return true;
                }
                else
                {
                    count = 1;
                    break;
                }
            }
        }
        return false;
    }

    // 判断是否为5位或更多连续相同数字的靓号
    static bool IsSameDigits(int number)
    {
        if (number < 10000)
        {
            return false;
        }
        string numString = number.ToString();
        for (int i = 0; i < numString.Length - 4; i++)
        {
            if (numString.Substring(i, 5).Replace(numString[i], ' ').Trim() == "")
            {
                Debug.Log("fit sameDigits:" + number);
                return true;
            }
        }
        return false;
    }


    // 判断一个整数是否是回文数
    static bool IsPalindrome(int num)
    {
        if (num < 0)
        {
            return false; // 负数不是回文数
        }

        int originalNum = num;
        int reversedNum = 0;

        while (num != 0)
        {
            int digit = num % 10;
            reversedNum = reversedNum * 10 + digit;
            num /= 10;
        }

        bool result = (originalNum == reversedNum);
        if (result == true)
        {
            Debug.Log(originalNum + " is palindrome");
        }
        return result;
    }


    // 判断是否为连续5个或更多数字按等差数列排列的靓号 :14567811
    static bool IsArithmeticSequence(int number)
    {
        string numString = number.ToString();
        for (int i = 0; i < numString.Length - 4; i++)
        {
            int difference = numString[i + 1] - numString[i];
            bool isSequence = true;
            for (int j = i + 1; j < numString.Length; j++)
            {
                if (numString[j] - numString[j - 1] != difference)
                {
                    isSequence = false;
                    break;
                }
            }
            if (isSequence)
            {
                Debug.Log(number + " fit arithmetic sequence");
                return true;
            }
        }
        return false;
    }

    // 判断是否为指定类型的靓号
    static bool IsSpecialType(int number)
    {
        string numString = number.ToString();

        // AABBCC、AAABBB、AAAABB、AABBBB 
        if (numString.Length >= 6)
        {
            for (int i = 0; i < numString.Length - 6; i++)
            {
                string subStr = numString.Substring(i, 6);
                if ((subStr[0] == subStr[1] && subStr[2] == subStr[3] && subStr[4] == subStr[5]) || // AABBCC
                    ((subStr[0] == subStr[1] && subStr[1] == subStr[2]) && (subStr[3] == subStr[4] && subStr[4] == subStr[5])) || // AAABBB
                    ((subStr[0] == subStr[1] && subStr[1] == subStr[2] && subStr[2] == subStr[3]) && subStr[4] == subStr[5]) || // AAAABB
                    ((subStr[2] == subStr[3] && subStr[3] == subStr[4] && subStr[4] == subStr[5]) && subStr[0] == subStr[1])) // AABBBB
                {
                    return true;
                }
            }
        }

        // ABABAB、ABCABC
        if (numString.Length >= 6)
        {
            for (int i = 0; i < numString.Length - 6; i++)
            {
                string subStr = numString.Substring(i, 6);
                if (((subStr[0] == subStr[2] && subStr[2] == subStr[4]) && (subStr[1] == subStr[3] && subStr[3] == subStr[5])) || // ABABAB
                    (subStr[0] == subStr[3] && subStr[1] == subStr[4] && subStr[2] == subStr[5]))  // ABCABC 
                {
                    return true;
                }
            }
        }
        // ABCDABCD、AAAABBBB
        if (numString.Length >= 8)
        {
            for (int i = 0; i < numString.Length - 8; i++)
            {
                string subStr = numString.Substring(i, 8);
                if (((subStr[0] == subStr[4] && subStr[1] == subStr[5]) && (subStr[2] == subStr[6] && subStr[3] == subStr[7])) ||// ABCDABCD 
                    (((subStr[0] == subStr[1] && subStr[1] == subStr[2]) && (subStr[2] == subStr[3]) && (subStr[4] == subStr[5] && subStr[5] == subStr[6] && subStr[6] == subStr[7]))))   //AAAABBBB
                {
                    return true;
                }
            }
        }



        // 以888、666、520、521开头或者结尾的
        if (numString.StartsWith("888") || numString.StartsWith("666") || numString.StartsWith("520") || numString.StartsWith("521") ||
            numString.EndsWith("888") || numString.EndsWith("666") || numString.EndsWith("520") || numString.EndsWith("521"))
            return true;

        return false;
    }
}
