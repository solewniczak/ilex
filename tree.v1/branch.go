package tree

import (
	"bytes"
	"fmt"
	"gopkg.in/mgo.v2"
	"ilex/ilex"
)

type Branch struct {
	Parent             Parent
	LengthLeft, Length int
	Left, Right        Node
}

func (b *Branch) IsLeftmostTNode() bool {
	switch left := b.Left.(type) {
	case *Branch:
		return left.IsRightmostTNode()
	case *TNode:
		return true
	default:
		return false
	}
}

func (b *Branch) IsRightmostTNode() bool {
	switch right := b.Right.(type) {
	case *Branch:
		return right.IsRightmostTNode()
	case *TNode:
		return true
	default:
		return false
	}
}

func (b *Branch) AddRune(r rune, position int) {
	var child Node
	if position < b.LengthLeft {
		child = b.Left
		b.LengthLeft++
	} else if position == b.LengthLeft {
		if b.IsLeftmostTNode() {
			child = b.Left
			b.LengthLeft++
		} else {
			child = b.Right
			position = position - b.LengthLeft
		}
	} else {
		child = b.Right
		position = position - b.LengthLeft
	}
	b.Length++
	child.AddRune(r, position)
}

func (b *Branch) WriteToBuffer(buffer *bytes.Buffer, slices *mgo.Collection) error {
	fmt.Println("going deeper")
	err := b.Left.WriteToBuffer(buffer, slices)
	if err != nil {
		fmt.Println("left child writing error")
		return err
	}
	err = b.Right.WriteToBuffer(buffer, slices)
	if err != nil {
		fmt.Println("right child writing error")
	}
	return err
}

func (b *Branch) Print(indentation int) {
	indent(indentation)
	fmt.Println("BRANCH:", b.LengthLeft, b.Length-b.LengthLeft, b.Length)
	indent(indentation)
	fmt.Println("left :")
	b.Left.Print(indentation + 1)
	indent(indentation)
	fmt.Println("right :")
	b.Right.Print(indentation + 1)
}

func (b *Branch) GetLength() int {
	return b.Length
}

func (b *Branch) Persist(addresses ilex.AddressTable, slices *mgo.Collection) (ilex.AddressTable, error) {
	addresses, err := b.Left.Persist(addresses, slices)
	if err != nil {
		fmt.Println("left child persistence error")
		return addresses, err
	}
	addresses, err = b.Right.Persist(addresses, slices)
	if err != nil {
		fmt.Println("right child persistence error")
	}
	return addresses, err
}

func (b *Branch) SetParent(parent Parent) {
	b.Parent = parent
}

func (b *Branch) ReplaceChild(previous, new Node) {
	if b.Left == previous {
		b.Left = new
	} else {
		b.Right = new
	}
}
