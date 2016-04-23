#include <algorithm>
#include <limits>
#include "kdtree.h"

void KDTree::create(const std::vector<Vertex> &vertex_set)
{
	root = createKDTree(vertex_set);
}

KDTreeNode* KDTree::createKDTree(const std::vector<Vertex> &vertex_set)
{
	if (vertex_set.empty())
		return NULL;

	std::vector<Vertex> vertex_set_copy(vertex_set);

	int size = vertex_set_copy.size();

	//! 计算每个维的方差，选出方差值最大的维
	double var_max = -0.1;
	double avg, var;
	int dim_max_var = -1;
	for (int i = 0; i < DIM; i++)
	{
		avg = 0;
		var = 0;
		//! 求某一维的总和
		for (int j = 0; j < size; j++)
		{
			//avg += exm_set_copy[j][i];
			avg += vertex_set_copy[j].coord[i];
		}
		//! 求平均
		avg /= size;
		//! 求方差
		for (int j = 0; j<size; j++)
		{
			/*var += (exm_set_copy[j][i] - avg) *
				(exm_set_copy[j][i] - avg);*/

			var += (vertex_set_copy[j].coord[i] - avg) * (vertex_set_copy[j].coord[i] - avg);
		}
		var /= size;
		if (var > var_max)
		{
			var_max = var;
			dim_max_var = i;
		}
	}

	//! 确定节点的数据矢量

	NodeCompare nodeComp(dim_max_var);
	std::sort(vertex_set_copy.begin(), vertex_set_copy.end(), nodeComp);

	int mid = size / 2;
	Vertex v_split = vertex_set_copy[mid]; //取出排序结果的中间节点
	vertex_set_copy.erase(vertex_set_copy.begin() + mid); //将中间节点作为父（根）节点，所有将其从数据集中去除

	//! 确定左右节点

	std::vector<Vertex> v_set_left;
	std::vector<Vertex> v_set_right;

	int size_new = vertex_set_copy.size(); //获得子数据空间大小
	for (int i = 0; i < size_new; i++)     //生成左右子节点
	{
		Vertex temp = vertex_set_copy[i];
		if (temp.coord[dim_max_var] < v_split.coord[dim_max_var])
			v_set_left.push_back(temp);
		else
			v_set_right.push_back(temp);
	}

	KDTreeNode *pNewNode = new KDTreeNode(0, 0, 0, dim_max_var, v_split);
	pNewNode->left = createKDTree(v_set_left); //递归调用生成左子树
	if (pNewNode->left != NULL)   //确认左子树父节点
		pNewNode->left->parent = pNewNode;
	pNewNode->right = createKDTree(v_set_right); //递归调用生成右子树
	if (pNewNode->right != NULL)  //确认右子树父节点
		pNewNode->right->parent = pNewNode;

	return pNewNode;  //最终返回k-d tree的根节点
}

void KDTree::destroyKDTree(KDTreeNode *root)
{
	if (root != NULL)
	{
		destroyKDTree(root->left);
		destroyKDTree(root->right);
		delete root;
	}
}

void KDTree::destroy()
{
	destroyKDTree(root);
}

std::pair<Vertex, double> KDTree::findNearest_i(KDTreeNode *root, Vertex target)
{
	//! 向下到达叶子节点

	KDTreeNode *pSearch = root;

	//! 堆栈用于保存搜索路径
	std::vector<KDTreeNode*> search_path;

	Vertex nearest;

	double max_dist;

	while (pSearch != NULL)  //首先通过二叉查找得到搜索路径
	{
		search_path.push_back(pSearch);
		int s = pSearch->getDim();
		if (target.coord[s] <= pSearch->getVertex().coord[s])
		{
			pSearch = pSearch->left;
		}
		else
		{
			pSearch = pSearch->right;
		}
	}

	nearest = search_path.back()->getVertex();  //取路径中最后的叶子节点为回溯前的最邻近点
	max_dist = DistanceNode(nearest, target);

	search_path.pop_back();

	//! 回溯搜索路径
	while (!search_path.empty())
	{
		KDTreeNode *pBack = search_path.back();
		search_path.pop_back();

		if (pBack->left == NULL && pBack->right == NULL)  //如果是叶子节点，就直接比较距离的大小
		{
			if (DistanceNode(nearest, target) > DistanceNode(pBack->getVertex(), target))
			{
				nearest = pBack->getVertex();
				max_dist = DistanceNode(pBack->getVertex(), target);
			}
		}
		else
		{
			int s = pBack->getDim();
			//以target为圆心，max_dist为半径的圆和分割面如果
			//有交割,则需要进入另一边子空间搜索
			if (abs(pBack->getVertex().coord[s] - target.coord[s]) < max_dist)
			{
				if (DistanceNode(nearest, target) > DistanceNode(pBack->getVertex(), target))
				{
					nearest = pBack->getVertex();
					max_dist = DistanceNode(pBack->getVertex(), target);
				}
				if (target.coord[s] <= pBack->getVertex().coord[s])  //如果target位于左子空间，就应进入右子空间
					pSearch = pBack->right;
				else
					pSearch = pBack->left;  //如果target位于右子空间，就应进入左子空间
				if (pSearch != NULL)
					search_path.push_back(pSearch);  //将新的节点加入search_path中
			}
		}
	}

	std::pair<Vertex, double> res(nearest, max_dist);

	return res;  //返回包含最邻近点和最近距离的pair
}

std::pair<Vertex, double> KDTree::findNearest(Vertex target)
{
	std::pair<Vertex, double> res;
	if (root == NULL)
	{
		res.second = std::numeric_limits<double>::infinity();
		return res;
	}
	return findNearest_i(root, target);
}
